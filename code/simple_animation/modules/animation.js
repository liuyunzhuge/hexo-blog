let _continueStart = Symbol('continueStart');

export default class Animation {
    constructor({
                       duration,
                       iterationCount = 1,
                       ease = Animation.EASE.LINEAR,
                       direction = Animation.DIRECTION.NORMAL,
                       onProgress = Animation.noop
                   } = {}) {
        this.id = Animation.nextId();
        this.duration = duration;
        this.ease = ease;
        this.iterationCount = iterationCount;
        this.direction = direction;
        this.onProgress = onProgress;
        this.playState = null;
        this.promise = null;
    }

    start() {
        this.promise = new Promise((resolve, reject) => {
            this.playState = Animation.playState.RUNNING;
            this.startTime = Date.now();//记录动画每次迭代的开始时间
            this.progress = 0;//记录动画每次迭代的进程
            let _iterationCount = 0;//累计动画迭代次数

            // 设置动画方向：只有在normal 和 alternate时，方向才是正向的
            let isPositiveDirection = this.direction === Animation.DIRECTION.NORMAL || this.direction === Animation.DIRECTION.ALTERNATE;

            let iterationFinished = () => {
                if (this.iterationCount === 'infinite') return false;
                return _iterationCount >= this.iterationCount;
            };

            this[_continueStart] = () => {
                if( this.playState === Animation.playState.DESTROYED ) {
                    return reject(new Error('animation destroyed...'));
                }
                
                let currentTime = Date.now();
                this.progress = Math.min(1.0, (currentTime - this.startTime) / this.duration);
                this.onProgress(this.ease(isPositiveDirection ? this.progress : (1 - this.progress)));

                if (this.progress >= 1.0) {
                    // 累加动画迭代次数
                    _iterationCount += 1;
                }

                let isLastIteration = iterationFinished();
                let goon = this.playState === Animation.playState.RUNNING;

                // 本次动画迭代结束
                if (this.progress >= 1.0) {
                    if (!isLastIteration) {
                        // 重置动画的状态
                        this.progress = 0;
                        this.startTime = currentTime;

                        // 只有alternate和alternate_reverse时，动画才会在结束点切换方向
                        if (this.direction === Animation.DIRECTION.ALTERNATE || this.direction === Animation.DIRECTION.ALTERNATE_REVERSE) {
                            isPositiveDirection = !isPositiveDirection;
                        }
                    } else {
                        // 动画完全结束回调
                        resolve(this);
                        goon = false;
                    }
                }

                goon && requestAnimationFrame(this[_continueStart]);
            };

            requestAnimationFrame(this[_continueStart]);
        });

        return this.promise;
    }

    //销毁
    destroy() {
        this.playState = Animation.playState.DESTROYED;
    }

    //恢复
    resume() {
        if(this.playState === Animation.playState.PAUSED) {
            this.startTime = (Date.now() * 100000 - this.duration * this.progress * 100000)/100000;
            this.playState = Animation.playState.RUNNING;   
            this[_continueStart]();
        }
    }

    //暂停
    pause() {
        if(this.playState === Animation.playState.RUNNING) {
            this.playState = Animation.playState.PAUSED;
        }
    }

    static DIRECTION = {
        NORMAL: 'normal',
        REVERSE: 'reverse',
        ALTERNATE: 'alternate',
        ALTERNATE_REVERSE: 'alternate_reverse'
    }

    static playState = {
        RUNNING: Symbol('running'),
        DESTROYED: Symbol('destroyed'),
        PAUSED: Symbol('paused')
    }

    static EASE = {
        LINEAR: function (p) {
            return p;
        }
    }

    static noop() {
    }

    static nextId = (function() {
        let id = 0;
        return function () {
            return ++id;
        }
    })()
};