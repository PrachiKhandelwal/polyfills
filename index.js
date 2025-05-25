class MyPromise {
    #thenCbs = [];
    #catchCbs = [];
    #state = "pending";
    #value;
    #onSuccessBinded = this.#onSuccess.bind(this);
    #onFailBinded = this.#onFail.bind(this);

    constructor(cb) {
        try {
            cb(this.#onSuccessBinded, this.#onFailBinded);
        } catch (e) {
            this.#onFail(e);
        }
    }

    #onSuccess(val) {
        queueMicrotask(() => {
            if (this.#state !== "pending") {
                return;
            }
            if (val instanceof MyPromise) {
                return val.then(this.#onSuccessBinded, this.#onFailBinded);
            }
            this.#state = "fulfilled";
            this.#value = val;
            this.#thenCbs.forEach((cb) => {
                cb(this.#value);
            });
            this.#thenCbs = [];
        });
    }

    #onFail(val) {
        queueMicrotask(() => {
            if (this.#state !== "pending") return;
            if (val instanceof MyPromise) {
                return val.then(this.#onSuccessBinded, this.#onFailBinded);
            }
            this.#state = "rejected";
            this.#value = val;
            this.#catchCbs.forEach((cb) => {
                cb(this.#value);
            });
            this.#catchCbs = [];
        });
    }

    then(thenCb, catchCb) {
        return new MyPromise((res, rej) => {
            this.#thenCbs.push((result) => {
                if (thenCb === null || thenCb === undefined) {
                    res(result);
                    return;
                }
                try {
                    res(thenCb(result));
                } catch (e) {
                    rej(e);
                }
            });
            this.#catchCbs.push((result) => {
                if (catchCb === null || catchCb === undefined) {
                    res(result);
                    return;
                }
                try {
                    rej(catchCb(result));
                } catch (e) {
                    rej(e);
                }
            });
            if (this.#state === "fulfilled") {
                queueMicrotask(() => {
                    this.#thenCbs.forEach((cb) => {
                        cb(this.#value);
                    });
                    this.#thenCbs = [];
                });
            }
            if (this.#state === "rejected") {
                queueMicrotask(() => {
                    this.#catchCbs.forEach((cb) => {
                        cb(this.#value);
                    });
                    this.#catchCbs = [];
                });
            }
        });
    }
    catch(cb) {
        return this.then(null, cb);
    }
    finally(cb) {
        return this.then(
            (result) => {
                cb();
                return result;
            },
            (result) => {
                cb();
                return result;
            }
        );
    }

    static resolve(val) {
        return new MyPromise((res, rej) => {
            res(val);
        });
    }

    static reject(val) {
        return new MyPromise((res, rej) => {
            rej(val);
        });
    }

    static all(promises) {
        return new MyPromise((res, rej) => {
            const results = [];
            let completedPromises = 0;

            promises.forEach((p, i) => {
                p.then((val) => {
                    results[i] = val;
                    completedPromises++;
                    if (completedPromises === promises.length) {
                        res(results);
                    }
                }).catch(rej);
            });
        });
    }

    static allSettled(promises) {
        return new MyPromise((res, rej) => {
            const results = [];
            let completedPromises = 0;

            promises.forEach((p, i) => {
                p.then((val) => {
                    results[i] = {
                        state: "fulfilled",
                        value: val,
                    };
                })
                    .catch((e) => {
                        results[i] = {
                            state: "rejected",
                            reason: e,
                        };
                    })
                    .finally(() => {
                        completedPromises++;
                        if (completedPromises === promises.length) {
                            res(results);
                        }
                    });
            });
        });
    }

    static race(promises) {
        return new MyPromise((res, rej) => {
            promises.forEach((p) => {
                p.then(res).catch(rej);
            });
        });
    }

    static any(promises) {
        const errors = [];
        let completedPromises = 0;
        return new MyPromise((res, rej) => {
            promises.forEach((p, i) => {
                p.then(res).catch((e) => {
                    errors[i] = e;
                    completedPromises++;
                    if (completedPromises === promises.length) {
                        rej(new AggregateError(errors, "All promises failed"));
                    }
                });
            });
        });
    }
}

const p = MyPromise.resolve(5);
p.then(console.log);
