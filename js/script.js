// 대상을 지정하는 방법은 자바스크립트에선 변수 지정함
// jQuery에선 $("")

$(".hide-btn").click(function () {
    $(".text1").hide(1000);
})
$(".show-btn").click(function () {
    $(".text1").show();
    $(".text1").css("color", "pink");
})
$(".toggle-btn").click(function () {
    $(".text1").toggle(1000);
    $(".text1").css("color", "pink");
})


$(".fade-in").click(function () {
    $(".text2").fadeIn();
    // $(".text2").fadeIn("slow");
    // $(".text2").fadeIn(3000);
});
$(".fade-out").click(function () {
    $(".text2").fadeOut();
    // $(".text2").fadeOut("slow");
    // $(".text2").fadeOut(3000);
});
$(".fade-toggle").click(function () {
    $(".text2").fadeToggle();
})


$(".slide-down").click(function () {
    $(".text3").slideDown();
});
$(".slide-up").click(function () {
    $(".text3").slideUp();
});
$(".slide-toggle").click(function () {
    $(".text3").slideToggle();
})

// animation
$(".ani-btn-1").click(function () {
    $(".ani").stop().animate({
        left: '+=250px',
        opacity: '0.5',
        height: '150px',
        width: '150px'
    });
});

$(".ani-btn-2").click(function () {
    $(".ani").animate({
        left: '250px',
        height: '+=150px',
        width: '+=150px'
    });
});

$(".ani-btn-3").click(function () {
    $(".ani").animate({
        left: '250px',
        height: 'toggle',
        width: 'toggle'
    });
});

let mot = $(".mot-btn");
let aniBox = $(".box-2");

mot.click(function() {
    aniBox.animate({
        height:'300px',
        opacity:'0.5',
    },1000);
    aniBox.animate({
        width:'300px',
        opacity:'0.8',
        fontSize:'3em'
    },2000);
    aniBox.animate({
        height:'100px',
        fontSize:'2em'
    },1000);
    aniBox.animate({
        width:'100px',
        fontSize:'1em'
    },1000);
});