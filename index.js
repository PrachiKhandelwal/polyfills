const STATE = {
    FULFILLED: "fulfilled",
    REJECTED: "rejected",
    PENDING: "pending",
};

class MyPromise {
    #thenCbs = [];
    #catchCbs = [];
    #state = STATE.PENDING; //fulfilled
    #value; //10
    constructor(cb) {
        try {
            cb(this.#onSuccess.bind(this), this.#onFailure.bind(this));
        } catch (err) {
            this.#onFailure(err);
        }
    }
    #runCbs() {
        if (this.#state === STATE.FULFILLED) {
            this.#thenCbs.forEach((cb) => {
                cb(this.#value);
            });
            this.#thenCbs = [];
        }
        if (this.#state === STATE.REJECTED) {
            this.#catchCbs.forEach((cb) => {
                cb(this.#value);
            });
            this.#catchCbs = [];
        }
    }
    #onSuccess(val) {
        if (this.#state !== STATE.PENDING) return;
        this.#value = val;
        this.#state = STATE.FULFILLED;
        this.#runCbs();
    }

    #onFailure(val) {
        if (this.#state !== STATE.PENDING) return;
        this.#value = val;
        this.#state = STATE.REJECTED;
        this.#runCbs();
    }

    then(cb) {
        this.#thenCbs.push(cb);
        this.#runCbs();
    }

    catch(cb) {
        this.#catchCbs.push(cb);
        this.#runCbs();
    }
}
const p = new MyPromise((res, rej) => {
    setTimeout(() => {
        res(10);
    }, 0);
});
p.then((val) => console.log(val));
