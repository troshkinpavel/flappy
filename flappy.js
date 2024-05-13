/*
* FlappyBird.js 1.0
*
* Copyright 2014, Paul Troshkin troshkinp@proton.me
*
* Date: Sun February 16 14:23:00 2014 +0400
*/

/*
* FlappyBird.js 2.0 (vanillajs refactor)
*
* Copyright 2024, Paul Troshkin troshkinp@proton.me
*
* Date: Sun February 16 14:23:00 2014 +0400
 */

function FlappyBird(elementId, options) {
    const defaultOptions = {
        total: 10,
        step: 300,
        innerColumn: 170,
        backgroundImage: null,
        debug: false
    };
    const finalOptions = {...defaultOptions, ...options};
    const appContainer = document.getElementById(elementId);

    if (finalOptions.debug) {
        console.log("Debug mode enabled");
        console.table(finalOptions);
    }

    if (!appContainer) {
        throw new Error('Element with id ' + elementId + ' not found');
    }

    let totalColumns = finalOptions.total; // set all column

    const flappyUI = {
        flappy: null,
        flappyAnimation: null,
        flappyCount: null,
        flappyLine: null,
        flappyContainer: appContainer,
        flappyColumns: null
    }
    let columns = [];
    const allResults = [];
    let gameTickInterval = 0;
    const animations = {
        columns: null,
        flappy: null
    }

    if (totalColumns < appContainer.offsetWidth / finalOptions.step) {
        totalColumns = appContainer.offsetWidth / finalOptions.step + 1;
    }

    const flappyStyle = ['flappy', 'flappy-b', 'flappy-g'];
    const flappyColor = flappyStyle[Math.floor(Math.random() * flappyStyle.length)];
    applyStyles(appContainer, finalOptions);

    window.addEventListener('resize', () => location.reload());

    function applyStyles(element, options) {
        let backgroundImage;
        const backgroundStyle = ['city', 'space', 'sea', 'cemetery', 'swamp', 'sea-sunset', 'sea-night'];
        if (backgroundStyle.includes(options.backgroundImage)) {
            backgroundImage = options.backgroundImage;
        } else {
            backgroundImage = backgroundStyle[Math.floor(Math.random() * backgroundStyle.length)];
        }

        element.style.background = `transparent url(./assets/background-${backgroundImage}.png) 0 0 no-repeat`;
        element.style.backgroundSize = 'cover';
        element.style.overflow = 'hidden';
        element.style.cursor = 'pointer';
        element.style.userSelect = 'none';
    }

    // ---------------------------------------------- CREATE SCENE --------------------------------------------------------

    function createFlappy() {
        flappyUI.flappy = document.createElement('div');
        flappyUI.flappyAnimation = document.createElement('div');
        flappyUI.flappy.classList.add('flappy');
        flappyUI.flappyAnimation.classList.add('flappy-animation');
        flappyUI.flappyAnimation.style.backgroundImage = 'url(./assets/' + flappyColor + '.gif)';
        flappyUI.flappy.appendChild(flappyUI.flappyAnimation);
    }

    function createScene() {
        createFlappy();
        flappyUI.flappyContainer.innerHTML = '';
        flappyUI.flappyCount = document.createElement('span');
        flappyUI.flappyCount.classList.add('flappy-counts');
        if (finalOptions.debug) {
            flappyUI.flappyContainer.classList.add('debug');
        }
        flappyUI.flappyCount.textContent = 0;
        flappyUI.flappyLine = document.createElement('div');
        flappyUI.flappyContainer.appendChild(flappyUI.flappyCount);
        flappyUI.flappyContainer.appendChild(flappyUI.flappy);
        flappyUI.flappyContainer.appendChild(flappyUI.flappyLine);
        flappyUI.flappyLine.classList.add('flappy-line');
        flappyUI.flappyLine.style.width = flappyUI.flappyContainer.width + 'px';
        generateColumns(totalColumns);
    }

    function addColumn(xPos, index) {
        const _column = document.createElement('div');
        const _column_up = document.createElement('div');
        const _column_down = document.createElement('div');
        _column.classList.add('flappy-column');
        _column.setAttribute('data-index', index);
        _column.style.height = (flappyUI.flappyContainer.offsetHeight + finalOptions.innerColumn) + 'px';
        _column.style.marginLeft = xPos + 'px';
        _column.style.top = Math.floor(Math.random() * -(finalOptions.innerColumn)) + 'px';
        _column_up.classList.add('flappy-up-column');
        _column_down.classList.add('flappy-down-column');
        _column_up.style.height = (flappyUI.flappyContainer.offsetHeight / 2) + 'px';
        _column_down.style.height = (flappyUI.flappyContainer.offsetHeight / 2) + 'px';
        _column.appendChild(_column_up);
        _column.appendChild(_column_down);
        columns.push(_column);
        flappyUI.flappyColumns.appendChild(_column);
    }

    function generateColumns(cols) {
        columns = [];
        flappyUI.flappyColumns = document.createElement('div');
        flappyUI.flappyColumns.classList.add('flappy-columns');
        flappyUI.flappyColumns.style.left = flappyUI.flappyContainer.offsetWidth + 'px';
        flappyUI.flappyContainer.appendChild(flappyUI.flappyColumns);
        for (let i = 0; i < cols; i++) {
            addColumn(finalOptions.step * i, i)
        }
    }

    function startColumnAnimation(columns) {
        const columnsKeyframes = new KeyframeEffect(flappyUI.flappyColumns, {
            left: (-(columns + 40) * 400) + 'px'
        }, {
            duration: (columns + 40) * 1635,
            easing: 'linear'
        });
        animations.columns = new Animation(columnsKeyframes, document.timeline);
        animations.columns.finished.then(gameOver);
        animations.columns.play();
    }

    // ------------------------------------------------------- COLLISION --------------------------------------------------

    function areElementsOverlapping(elem1, elem2) {
        const rect1 = elem1.getBoundingClientRect();
        const rect2 = elem2.getBoundingClientRect();

        if (rect1.right < rect2.left) {
            return false;
        }

        if (rect1.left > rect2.right) {
            return false;
        }

        if (rect1.bottom < rect2.top) {
            return false;
        }

        return rect1.top <= rect2.bottom;
    }

    function collisionColumns() {
        if (!columns.length) return;
        collisionBottom();

        const flappyX = flappyUI.flappy.getBoundingClientRect().x;
        const columnX = columns[0].getBoundingClientRect().x + columns[0].getBoundingClientRect().width;
        const index = columns[0].getAttribute('data-index');

        if (flappyX < columnX) {
            if (areElementsOverlapping(flappyUI.flappy, columns[0])) {
                if (areElementsOverlapping(flappyUI.flappy, columns[0].children[0])) {
                    if (finalOptions.debug) {
                        columns[0].classList.add('debug_hit');
                        columns[0].children[0].classList.add('debug_collide');
                        console.warn('collide with down column, index: ' + index);
                    } else {
                        gameOver();
                        return;
                    }
                }
                if (areElementsOverlapping(flappyUI.flappy, columns[0].children[1])) {
                    if (finalOptions.debug) {
                        columns[0].classList.add('debug_hit');
                        columns[0].children[1].classList.add('debug_collide');
                        console.warn('collide with up column, index: ' + index);
                    } else {
                        gameOver();
                        return;
                    }
                }
            }
        } else {
            if (finalOptions.debug) {
                if (!columns[0].classList.contains('debug_hit')) {
                    columns[0].classList.add('debug_pass');
                    flappyUI.flappyCount.textContent = parseInt(flappyUI.flappyCount.textContent) + 1;
                } else {
                    flappyUI.flappyCount.textContent = parseInt(flappyUI.flappyCount.textContent) - 1;
                }
                console.log('change score: ' + flappyUI.flappyCount.textContent);
            } else {
                flappyUI.flappyCount.textContent = parseInt(flappyUI.flappyCount.textContent) + 1;
            }
            columns.splice(0, 1);
            return;
        }

        //------------- MOVE FIRST COLUMN TO END -----------------
        if (flappyUI.flappyColumns.children[0].getBoundingClientRect().x < -flappyUI.flappyColumns.children[0].getBoundingClientRect().width) {
            const index = flappyUI.flappyColumns.children[0].getAttribute('data-index');
            flappyUI.flappyColumns.children[0].remove();
            const lastLeft = flappyUI.flappyColumns.children[flappyUI.flappyColumns.children.length - 1].style.marginLeft;
            const lastLeftInt = parseInt(lastLeft) + finalOptions.step;
            addColumn(lastLeftInt, index);
        }
    }

    function collisionBottom() {
        if (flappyUI.flappy.offsetTop + flappyUI.flappy.offsetWidth >= flappyUI.flappyContainer.offsetHeight - flappyUI.flappyLine.offsetHeight) {
            gameOver();
        }
        if (flappyUI.flappy.offsetTop <= 0 - flappyUI.flappy.offsetWidth) {
            gameOver();
        }
    }

    // ------------------------------------------------------- UI ---------------------------------------------------------

    function drawGameOverWindow(finalResult, maxResult) {
        const medal = getMedalByScore(finalResult);

        // Elements
        const _flappyPlay = document.createElement('div');
        const _flappyPlayContainer = document.createElement('div');
        const _flappyResultText = document.createElement('div');
        const _flappyResultBack = document.createElement('div');
        const _flappyResultButtons = document.createElement('div');
        const _flappyRestartButton = document.createElement('div');
        const _flappyOtherButton = document.createElement('a');
        let _flappyBestResult = document.createElement('b');

        // Classes
        _flappyPlay.classList.add('flappy-play');
        _flappyPlayContainer.classList.add('flappy-back-result');
        _flappyResultText.classList.add('flappy-result-text');
        _flappyResultBack.classList.add('flappy-result-back');
        _flappyResultButtons.classList.add('flappy-buttons');
        _flappyRestartButton.classList.add('flappy-restart');
        _flappyOtherButton.classList.add('flappy-rate');

        // Styles
        _flappyResultText.style.opacity = 0;
        _flappyResultBack.style.opacity = 0;
        _flappyResultButtons.style.opacity = 0;
        _flappyResultText.style.marginTop = '-40px';
        _flappyResultBack.style.marginTop = '60px';
        _flappyOtherButton.href = 'https://twitter.com/troshkin_pavel';

        // Content block
        if (finalResult >= maxResult && finalResult > 0) {
            _flappyBestResult = document.createElement('b');
            _flappyBestResult.innerHTML = 'new';
        }
        _flappyResultText.innerHTML = '<h1>Game Over</h1>';
        _flappyResultBack.innerHTML = `
            <div class=flappy-result-medal>
                 <p>Medal</p>
                 <img src="./assets/${medal}.png" alt="Medal" />
            </div>
            <div class=flappy-results>
                <p>score</p>
                <h2>${finalResult}</h2>
                <p class="flappy-best-result">
                   ${(finalResult >= maxResult && finalResult > 0) ? _flappyBestResult.outerHTML : ''}
                   best
                </p>
                <h2>${maxResult}</h2>
            </div>
        `;

        // DOM Structure
        _flappyResultButtons.appendChild(_flappyRestartButton);
        _flappyResultButtons.appendChild(_flappyOtherButton);
        _flappyPlayContainer.appendChild(_flappyResultText);
        _flappyPlayContainer.appendChild(_flappyResultBack);
        _flappyPlayContainer.appendChild(_flappyResultButtons);
        _flappyPlay.appendChild(_flappyPlayContainer);
        flappyUI.flappyContainer.appendChild(_flappyPlay);

        // Animation
        _flappyPlay.animate([
            {backgroundColor: 'transparent'},
            {backgroundColor: 'rgba(255,255,255,.5)'},
            {backgroundColor: 'transparent'},
        ], {duration: 100, fill: "forwards"});
        _flappyResultText.animate([
            {opacity: 0, marginTop: '-40px'},
            {opacity: 1, marginTop: '0px'}
        ], {duration: 200, fill: "forwards"});
        _flappyResultBack.animate([
            {opacity: 0, marginTop: '60px'},
            {opacity: 1, marginTop: '20px'}
        ], {duration: 200, fill: "forwards", delay: 200})
        _flappyResultButtons.animate({opacity: 1}, {duration: 200, fill: "forwards", delay: 400});

        // Restart button
        _flappyRestartButton.tabIndex = 0;
        _flappyRestartButton.focus();
        _flappyRestartButton.addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
                _flappyPlay.remove();
                showPlayUI();
            }
        });
        _flappyRestartButton.addEventListener('click', () => {
            _flappyPlay.remove();
            showPlayUI();
        });
    }

    function showPlayUI() {
        createScene();

        const _flappyPlay = document.createElement('div');
        _flappyPlay.classList.add('flappy-play');
        _flappyPlay.innerHTML = `
            <div class="flappy-back-main">
                <div class="flappy-text">
                    <h2>Flappy Bird</h2>
                </div>
                <div class="flappy-click"></div>
            </div>
        `;

        fadeIn(_flappyPlay, 200, () => {});
        _flappyPlay.setAttribute('tabindex', '0');
        flappyUI.flappyLine.style.animationPlayState = 'running';
        flappyUI.flappyContainer.appendChild(_flappyPlay);

        flappyUI.flappy.style.top = undefined;
        _flappyPlay.focus();

        _flappyPlay.addEventListener('keydown', (e) => {
            if (e.keyCode === 38 || e.keyCode === 87 || e.keyCode === 32) {
                playGame();
                fadeOut(_flappyPlay, 150, () => _flappyPlay.remove());
                flappyUI.flappyContainer.setAttribute('tabindex', '0');
                flappyUI.flappyContainer.focus();
            }
        });
        _flappyPlay.addEventListener('click', () => {
            playGame();
            _flappyPlay.remove();

            flappyUI.flappyContainer.setAttribute('tabindex', '0');
            flappyUI.flappyContainer.focus();
            fadeOut(_flappyPlay, 150, () => _flappyPlay.remove());
        });
    }

    function gameOver() {
        animations.columns.pause();
        // animations.flappy.pause();

        flappyUI.flappyLine.style.animationPlayState = 'paused';
        flappyUI.flappyAnimation.style.backgroundImage = 'url(./assets/' + flappyColor + '-dead.png)';

        flappyUI.flappyContainer.removeEventListener('mousedown', mouseHandler);
        flappyUI.flappyContainer.removeEventListener('keydown', keyHandler);
        flappyUI.flappyContainer.removeEventListener('click', mouseHandler);

        clearInterval(gameTickInterval);
        const finalResult = parseInt(flappyUI.flappyCount.textContent) || 0;
        allResults.push(finalResult);
        const maxResult = Math.max(...allResults);

        // $('.flappy-counts, .flappy-play').fadeOut(200);
        flappyUI.flappyCount.style.display = 'none';

        drawGameOverWindow(finalResult, maxResult);
    }

    function getMedalByScore(result) {
        let medal = '';
        if (result < 10) {
            medal = 'medal-no';
            return medal;
        }
        if (result >= 10 && result < 30) {
            medal = 'medal-silver';
            return medal;
        }
        if (result >= 30 && result < 50) {
            medal = 'medal-bronze';
            return medal;
        }
        if (result >= 50 && result < 75) {
            medal = 'medal-gold';
            return medal;
        }
        if (result >= 75) {
            medal = 'medal-ultimate';
            return medal;
        }
    }


    // ---------------------------------------------------- ANIMATIONS ----------------------------------------------------
    function flappyAnimation(to, animationSpeed) {
        // cancel all falling animations
        if (animations.flappy) {
            animations.flappy.pause();
            flappyUI.flappy.getAnimations().forEach((animation) => {
                if (animation.id === 'falling') animation.cancel();
            });
        }

        const duration = animationSpeed < 0 ? 0 : animationSpeed;
        const flappyDownKeyframes = new KeyframeEffect(
            flappyUI.flappy,
            {top: to + 'px'},
            {id: 'falling', duration, fill: 'forwards', easing: 'cubic-bezier(0.825, 0.620, 1.000, 0.815)'}
        );
        animations.flappy = new Animation(flappyDownKeyframes, document.timeline);
        animations.flappy.play();
    }

    function flappyUpAnimation(toUp = 70, animationSpeed = 120) {
        animations.flappy.pause();
        const flappyUpKeyframes = new KeyframeEffect(flappyUI.flappy, {
            top: (flappyUI.flappy.offsetTop - toUp) + 'px'
        }, {
            duration: animationSpeed,
            fill: 'forwards'
        });
        const flappyUpAnimate = new Animation(flappyUpKeyframes, document.timeline);
        flappyUpAnimate.finished.then(() => {
            animations.flappy.play();
            flappyAnimationUpdate();
        });
        flappyUpAnimate.play();
    }

    function fadeOut(element, duration = 200, cb) {
        element.style.opacity = '1';
        const animation = element.animate([
            {opacity: 1},
            {opacity: 0}
        ], {duration, fill: 'forwards'});
        animation.finished.then(cb);
    }

    function fadeIn(element, duration = 200, cb) {
        element.style.opacity = '0';
        const animation = element.animate([
            {opacity: 0},
            {opacity: 1}
        ], {duration, fill: 'forwards'});
        animation.finished.then(cb);
    }

    // ------------------------------------------------------- GAME -------------------------------------------------------

    function playGame() {
        startColumnAnimation(totalColumns);
        gameTimer();

        flappyUI.flappyAnimation.classList.add('flappy-down');
        flappyUI.flappy.style.animationPlayState = 'paused';

        const toTop = flappyUI.flappyContainer.offsetHeight - (flappyUI.flappy.offsetHeight + flappyUI.flappyLine.offsetHeight) - 11;
        flappyAnimation(toTop, 500 * 2);

        flappyUI.flappyContainer.addEventListener('mousedown', mouseHandler);
        flappyUI.flappyContainer.addEventListener('keydown', keyHandler);
    }

    function gameTimer(refreshRate = 20) {
        clearInterval(gameTickInterval);
        collisionColumns();
        collisionBottom();
        gameTickInterval = setInterval(collisionColumns, refreshRate);
    }

    function getFlappyCurrentPosition() {
        return flappyUI.flappy.offsetTop + (flappyUI.flappy.offsetHeight + flappyUI.flappyLine.offsetHeight);
    }

    const birdJump = () => {
        flappyUI.flappyAnimation.classList.add('flappy-up');
        flappyUI.flappyAnimation.classList.remove('flappy-down');
        flappyUpAnimation();
    };

    function mouseHandler(e) {
        e.preventDefault();
        birdJump();
    }

    function keyHandler(e) {
        e.preventDefault();
        if (e.keyCode === 38 || e.keyCode === 87 || e.keyCode === 32) {
            birdJump();
        }
    }

    function flappyAnimationUpdate() {
        flappyUI.flappyAnimation.classList.remove('flappy-up');
        if (!flappyUI.flappyAnimation.classList.contains('flappy-down')) {
            flappyUI.flappyAnimation.classList.add('flappy-down');
        }

        const currentHeight = getFlappyCurrentPosition();
        const heightToBottom = flappyUI.flappyContainer.offsetHeight - flappyUI.flappyLine.offsetHeight;
        const animationSpeed = (heightToBottom - currentHeight) * 2.8
        const toTop = flappyUI.flappyContainer.offsetHeight - (flappyUI.flappy.offsetHeight + flappyUI.flappyLine.offsetHeight);

        flappyAnimation(toTop, animationSpeed);
    }

    // ------------------------------------------------------- CALL -------------------------------------------------------
    showPlayUI();
}
