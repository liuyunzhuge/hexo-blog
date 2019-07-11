export default class {
    constructor() {
        this.tasks = [];
    }

    push(...tasks) {
        this.tasks.push(...tasks);
        return this;
    }

    run() {
        if (this.tasks.length === 0) return;

        let _run = () => {
            if (this.tasks.length === 0) return;


            let task = this.tasks.shift();
            let ret = task();

            if (ret instanceof Promise) {
                ret.then(() => {
                    _run();
                });
            } else {
                _run();
            }
        };


        _run();
    }
};
