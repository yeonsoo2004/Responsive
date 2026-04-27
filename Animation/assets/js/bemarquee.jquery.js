/*
 BeMarquee Js
 v-1.0.0
 https://github.com/mehedidb/bemarquee
 Copyright (C) Mehedi Hasan Nahid
 Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

"use strict";

(function ($) {

    const BeMarquee = {

        init: function () {

            $('.be-marquee').each(function () {

                let $wrap = $(this);

                if ($wrap.hasClass('be-marquee-inited')) return;
                $wrap.addClass('be-marquee-inited');

                let settings = BeMarquee.getSettings($wrap);

                BeMarquee.apply($wrap, settings);

                setTimeout(() => {
                    BeMarquee.animate($wrap, settings);
                }, 50);
            });
        },

        getSettings: function ($wrap) {

            let data = {};

            try {
                data = JSON.parse($wrap.attr('data-settings') || '{}');
            } catch (e) {}

            return {
                direction: 'left',
                speed: 1,
                gap: 30,
                loop: true,
                pause_on_hover: true,
                pause_on_click: false,
                reverse_on_hover: false,
                start_delay: 0,
                vertical: false,
                auto_height: false,
                ...data
            };
        },

        apply: function ($wrap, settings) {

            $wrap.css({
                overflow: 'hidden',
                position: 'relative',
                width: '100%'
            });

            let $inner = $wrap.find('.be-marquee-inner');

            $inner.css({
                display: 'inline-flex',
                whiteSpace: settings.vertical ? 'normal' : 'nowrap',
                gap: settings.gap + 'px',
                minWidth: '100%'
            });

            if (settings.vertical) {
                $inner.css('flex-direction', 'column');
            }

            // 🔥 auto height
            if (settings.vertical && settings.auto_height) {
                setTimeout(() => {
                    $wrap.css('height', $inner[0].scrollHeight + 'px');
                }, 30);
            }
        },

        fill: function ($inner, $wrap, settings) {

            let base = $inner.html();

            let size = settings.vertical
                ? $inner[0].scrollHeight
                : $inner[0].scrollWidth;

            let container = settings.vertical
                ? $wrap[0].offsetHeight
                : $wrap[0].offsetWidth;

            while (size < container * 2) {
                $inner.append(base);
                size = settings.vertical
                    ? $inner[0].scrollHeight
                    : $inner[0].scrollWidth;
            }

            return size / 2;
        },

        animate: function ($wrap, settings) {

            let $inner = $wrap.find('.be-marquee-inner');
            if (!$inner.length) return;

            let loopPoint;

            if (settings.loop === true) {
                loopPoint = BeMarquee.fill($inner, $wrap, settings);
            } else {
                loopPoint = settings.vertical
                    ? $inner[0].scrollHeight
                    : $inner[0].scrollWidth;
            }

            let dir = settings.direction === 'right' ? 1 : -1;
            let pos = 0;
            let paused = false;

            const frame = function () {

                if (!paused) {

                    pos += dir * settings.speed;

                    if (settings.loop === true) {

                        if (Math.abs(pos) >= loopPoint) {
                            pos = 0;
                        }

                    } else {

                        let max = settings.vertical
                            ? $inner[0].scrollHeight - $wrap[0].offsetHeight
                            : $inner[0].scrollWidth - $wrap[0].offsetWidth;

                        if (dir === -1 && Math.abs(pos) >= max) return;
                        if (dir === 1 && pos >= 0) return;
                    }

                    $inner.css('transform', settings.vertical
                        ? `translateY(${pos}px)`
                        : `translateX(${pos}px)`
                    );
                }

                requestAnimationFrame(frame);
            };

            setTimeout(frame, settings.start_delay);

            // interactions
            if (settings.pause_on_hover) {
                $wrap.on('mouseenter', () => paused = true);
                $wrap.on('mouseleave', () => paused = false);
            }

            // if (settings.reverse_on_hover) {
            //     $wrap.on('mouseenter', () => dir *= -1);
            // }

if (settings.reverse_on_hover) {

    $wrap.on('mouseenter', () => {

        paused = true;

        setTimeout(() => {
            dir *= -1;
            paused = false;
        }, 50); // small delay = safe switch
    });
}

            if (settings.pause_on_click) {
                $wrap.on('click', () => paused = !paused);
            }
        }

    };

    $(document).ready(function () {
        BeMarquee.init();
    });

})(jQuery);
