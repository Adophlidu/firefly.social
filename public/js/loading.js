;(function () {
    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    Promise.all([
        Promise.race([document.fonts.ready, delay(3000)]), // max for 3000ms
        delay(300), // min for 300ms
    ]).finally(() => {
        document.documentElement.classList.remove('font-loading');
    });
})();
