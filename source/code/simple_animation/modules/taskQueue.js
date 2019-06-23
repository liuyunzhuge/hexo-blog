function TaskQueue() {
    this.tasks = [];
}


Object.assign(TaskQueue.prototype, {
    push: function (...tasks) {
        this.tasks.push(...tasks);
        return this;
    },
    start: function () {
        if (this.tasks.length === 0) return;


        let _start = () => {
            if (this.tasks.length === 0) return;


            let task = this.tasks.shift();
            let ret = task();


            if (ret instanceof Promise) {
                ret.then(() => {
                    _start();
                });
            } else {
                _start();
            }
        };


        _start();
    }
});

export default TaskQueue;