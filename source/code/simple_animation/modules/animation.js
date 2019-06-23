Animation.noop = function () {
};


Animation.nextId = (function () {
    let id = 0;
    return function () {
        return ++id;
    }
})();


Animation.DIRECTION = {
    NORMAL: 'normal',
    REVERSE: 'reverse',
    ALTERNATE: 'alternate',
    ALTERNATE_REVERSE: 'alternate_reverse'
};


Animation.EASE = {
    LINEAR: function (p) {
        return p;
    }
};


function Animation({
                       duration,
                       iterationCount = 1,
                       ease = Animation.EASE.LINEAR,
                       direction = Animation.DIRECTION.NORMAL,
                       onProcess = Animation.noop
                   } = {}) {
    this.id = Animation.nextId();
    this.duration = duration;
    this.ease = ease;
    this.iterationCount = iterationCount;
    this.direction = direction;
    this.onProcess = onProcess;
}


Object.assign(Animation.prototype, {
    start: function () {
        return new Promise(resolve => {
            let startTime = Date.now();
            let progress = 0;
            let _iterationCount = 0;


            // 设置初始的动画方向：只有在normal 和 alternate时，初始方向才是正向的
            let positive = this.direction === Animation.DIRECTION.NORMAL || this.direction === Animation.DIRECTION.ALTERNATE;


            let finished = () => {
                if (this.iterationCount === 'infinite') return false;
                return _iterationCount >= this.iterationCount;
            };


            let _start = () => {
                let curTime = Date.now();
                progress = Math.min(1.0, (curTime - startTime) / this.duration);
                this.onProcess(this.ease(positive ? progress : (1 - progress)));


                if (progress >= 1.0) {
                    // 累加动画执行的次数
                    _iterationCount += 1;
                }


                let _finished = finished();


                // 一个动画过程未结束 或者单个过程结束了但是动画因为有动画次数还没完全结束 则动画会继续进行
                let goon = progress < 1.0 || !_finished;


                // 本次动画过程结束
                if (progress >= 1.0) {
                    if (!_finished) {
                        // 动画整体未结束 因为iterationCount的原因
                        // 重置动画的状态
                        progress = 0;
                        startTime = curTime;


                        // 只有alternate和alternate_reverse时，动画才会在结束点切换方向
                        if (this.direction === Animation.DIRECTION.ALTERNATE || this.direction === Animation.DIRECTION.ALTERNATE_REVERSE) {
                            positive = !positive;
                        }
                    } else {
                        // 动画完全结束回调
                        resolve();
                    }
                }


                goon && requestAnimationFrame(_start);
            };


            requestAnimationFrame(_start);
        });
    }
});


export default Animation;