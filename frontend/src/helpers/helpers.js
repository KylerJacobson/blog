import moment from "moment-timezone";

const formatDate = (dateTime) => {
    //@follow-up Why is the PostgreSQL server UTC + 6 hours?
    let tempDate = new Date(dateTime);
    tempDate.setHours(tempDate.getHours() - 6);
    const formattedDate = moment(tempDate).format("MM/DD/YYYY h:mm A");
    return formattedDate;
};

export default formatDate;
