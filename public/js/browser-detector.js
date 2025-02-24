(function () {
    if (
        !window.bowser ||
        (window.FireflyApi &&
          typeof window.FireflyApi.callNativeMethod === "function") ||
        (window.webkit &&
          window.webkit.messageHandlers &&
          window.webkit.messageHandlers.callNativeMethod)
      )
        return;
    var isDisabled = false;
    try {
        function getCookie(field) {
            var pair = document.cookie.split('; ').filter(function (x) {
                return x.indexOf(field + '=') === 0;
            })[0];
            if (!pair) return '';
            var value = pair.split('=')[1];
            return value;
        }

        function isBridge() {
            if (typeof window.FireflyApi?.callNativeMethod === 'function') return true;
            if (typeof window.webkit?.messageHandlers?.callNativeMethod?.postMessage === 'function') return true;
            return false;
        }

        var browser = window.bowser.getParser(window.navigator.userAgent);
        var isValidBrowser = browser.satisfies({
            // also update src/polyfills/rollup.config.mjs
            ios: {
                safari: '>=16',
            },
            macos: {
                safari: '>=16',
            },
            mobile: {
                safari: '>=16',
                'android browser': '>103',
            },
            chrome: '>=103',
            firefox: '>=100',
            opera: '>=89',
            edge: '>=103',
        });

        if (!isValidBrowser && !isBridge()) {
            const showTip = (isDarkMode) => {
                if(isDisabled) return
                var locale = getCookie('locale');
                const isCN = locale === 'zh-Hans';
                const bgColor = isDarkMode ? 'var(--color-dark-bottom)' : 'white';

                const id = 'browser-tips';
                const oldTips = document.getElementById(id);
                if (oldTips) {
                    oldTips.remove();
                }
                const browserTips = document.createElement('div');
                browserTips.setAttribute('id', id);

                browserTips.setAttribute(
                    'style',
                    `display: flex; justify-content: space-between; align-items: center; position: fixed; left: 0; top: 0; width: 100%; z-index: 9999; padding: 10px; text-align: center; font-size: 12px; line-height: 18px; background-color: ${bgColor} !important`,
                );

                const keywordColor = isDarkMode ? 'var(--color-light-main)' : 'rgb(146, 80, 255)';
                const keywordTag = (link, name) =>
                    `<a target="_blank" rel="noreferrer noopener" href="${link}"
                        style="color:${keywordColor} !important;
                        font-weight: bold;"
                     >${name}</a>`;

                const chromeLinkTag = keywordTag('https://www.google.com/chrome/', 'Chrome');
                const downloadLinkTag = keywordTag('https://firefly.land/#download', isCN ? '下载' : 'download');

                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("fill", "none");
                svg.setAttribute("height", "24");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("width", "24");


                let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "m13.4139 11.9999 5.793-5.79303c.39-.39.39-1.02299 0-1.41399s-1.023-.39-1.414 0l-5.793 5.79302-5.79303-5.79302c-.39-.39-1.02299-.39-1.41399 0s-.39 1.02299 0 1.41399l5.79302 5.79303-5.79302 5.793c-.39.39-.39 1.023 0 1.414.195.195.44999.293.70699.293s.512-.098.707-.293l5.79303-5.793 5.793 5.793c.195.195.45.293.707.293s.512-.098.707-.293c.39-.39.39-1.023 0-1.414z");
                path.setAttribute("fill", "currentColor");
                svg.appendChild(path);

                svg.addEventListener('click', () => {
                    browserTips.remove();
                    document.body.classList.remove('group', 'not-support');
                    isDisabled = true
                });

                const content = document.createElement('div');
                content.innerHTML = isCN
                ? `请使用 ${chromeLinkTag} 或 ${downloadLinkTag} 我们的APP浏览`
                : `Please use ${chromeLinkTag} or ${downloadLinkTag} our app to explore more`;

                browserTips.appendChild(content)
                browserTips.appendChild(svg)


                document.body.appendChild(browserTips);
                document.body.classList.add('group', 'not-support');
            };

            //watch dark mode change
            const htmlElement = document.querySelector('html');
            showTip(htmlElement.classList.contains('dark'));
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isDark = mutation.target.classList.contains('dark');
                        if (isDark) {
                            showTip(true);
                        } else {
                            showTip(false);
                        }
                    }
                });
            });
            observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
        }
    } catch (error) {
        console.error('Failed to detect bowser, reason: ', error.message);
    }
})();
