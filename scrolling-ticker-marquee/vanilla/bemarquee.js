/*
 BeMarquee Js
 v-1.0.0
 https://github.com/mehedidb/bemarquee
 Copyright (C) Mehedi Hasan Nahid
 Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

"use strict";

class BeMarquee {

    constructor(selector = '.be-marquee') {
        this.elements = document.querySelectorAll(selector);
        this.init();
    }

    init() {
        this.elements.forEach((wrap) => {

            if (wrap.classList.contains('be-marquee-inited')) return;
            wrap.classList.add('be-marquee-inited');

            const settings = this.getSettings(wrap);

            this.apply(wrap, settings);

            setTimeout(() => {
                this.animate(wrap, settings);
            }, 50);
        });
    }

    getSettings(el) {
        try {
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
                ...JSON.parse(el.getAttribute('data-settings') || '{}')
            };
        } catch {
            return {};
        }
    }

    apply(wrap, settings) {

        wrap.style.overflow = 'hidden';
        wrap.style.position = 'relative';
        wrap.style.width = '100%';

        const inner = wrap.querySelector('.be-marquee-inner');
        if (!inner) return;

        inner.style.display = 'inline-flex';
        inner.style.whiteSpace = settings.vertical ? 'normal' : 'nowrap';
        inner.style.gap = settings.gap + 'px';
        inner.style.minWidth = '100%';

        if (settings.vertical) {
            inner.style.flexDirection = 'column';
        }

        // 🔥 auto height
        if (settings.vertical && settings.auto_height) {
            setTimeout(() => {
                wrap.style.height = inner.scrollHeight + 'px';
            }, 30);
        }
    }

    fill(inner, wrap, settings) {

        let base = inner.innerHTML;

        let size = settings.vertical
            ? inner.scrollHeight
            : inner.scrollWidth;

        let container = settings.vertical
            ? wrap.offsetHeight
            : wrap.offsetWidth;

        while (size < container * 2) {
            inner.innerHTML += base;
            size = settings.vertical
                ? inner.scrollHeight
                : inner.scrollWidth;
        }

        return size / 2;
    }

    animate(wrap, settings) {

        const inner = wrap.querySelector('.be-marquee-inner');
        if (!inner) return;

        let loopPoint;

        if (settings.loop === true) {
            loopPoint = this.fill(inner, wrap, settings);
        } else {
            loopPoint = settings.vertical
                ? inner.scrollHeight
                : inner.scrollWidth;
        }

        let dir = settings.direction === 'right' ? 1 : -1;
        let pos = 0;
        let paused = false;

        const frame = () => {

            if (!paused) {

                pos += dir * settings.speed;

                if (settings.loop === true) {

                    if (Math.abs(pos) >= loopPoint) {
                        pos = 0;
                    }

                } else {

                    let max = settings.vertical
                        ? inner.scrollHeight - wrap.offsetHeight
                        : inner.scrollWidth - wrap.offsetWidth;

                    if (dir === -1 && Math.abs(pos) >= max) return;
                    if (dir === 1 && pos >= 0) return;
                }

                inner.style.transform = settings.vertical
                    ? `translateY(${pos}px)`
                    : `translateX(${pos}px)`;
            }

            requestAnimationFrame(frame);
        };

        setTimeout(frame, settings.start_delay);

        if (settings.pause_on_hover) {
            wrap.addEventListener('mouseenter', () => paused = true);
            wrap.addEventListener('mouseleave', () => paused = false);
        }

        // if (settings.reverse_on_hover) {
        //     wrap.addEventListener('mouseenter', () => dir *= -1);
        // }

if (settings.reverse_on_hover) {

    wrap.addEventListener('mouseenter', () => {

        paused = true;

        setTimeout(() => {
            dir *= -1;
            paused = false;
        }, 50);
    });
}

        if (settings.pause_on_click) {
            wrap.addEventListener('click', () => paused = !paused);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BeMarquee();
});
