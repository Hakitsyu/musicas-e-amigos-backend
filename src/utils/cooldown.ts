class Cooldown {
    private _date: Date;
    time: number;

    constructor(time: number) {
        this._date = new Date();
        this.time = time;
    }

    updateDate = () => this._date = new Date();

    can = (): boolean => {
        const currentDate = new Date();
        const difference = (currentDate.getTime() - this.date.getTime()) / 1000;
        if (difference >= this.time) {
            this.updateDate();
            return true;
        }

        return false;
    }
    
    get date() {
        return this._date;
    }
}

export default Cooldown;