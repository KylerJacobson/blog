import moment from "moment-timezone";

function formatDate(utcDate) {
    const momentUtcDate = moment.tz(utcDate, "YYYY-MM-DD HH:mm:ss.SSS", "UTC");
    const localDate = momentUtcDate.tz(moment.tz.guess());
    return localDate.format("MM/DD/YYYY h:mma");
}

export default formatDate;
