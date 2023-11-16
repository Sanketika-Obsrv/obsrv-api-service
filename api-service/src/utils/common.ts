import { DateRange } from "../models/ExhaustModels";
import moment from "moment";
import * as _ from "lodash";
import { Request, Response } from "express";

export const getPeriodInterval = (since: String): DateRange => {
    const period = since.toLowerCase().split("_")[1];
    return {
        from: moment().subtract(period, "days").format("yyyy-MM-DD"),
        to: moment().startOf("day").format("yyyy-MM-DD"),
    };
};

export const getDateRange = (request: Request, response: Response) => {
    const { from, to, since } = request.query;
    let period;
    if (!_.isUndefined(since)) {
        period = getPeriodInterval(since.toString());
    } else if (from != undefined && to != undefined) {
        period = { from: from.toString(), to: to.toString() };
    } else {
        period = getPeriodInterval("LAST_0_DAYS");
    }
    return period;
};

export const getFileKey = (key: string): string => {
    let keyArray: string[] = key.split("/");
    return keyArray[keyArray.length - 1].slice(0, 10);
};

export const isValidDateRange = (
    fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0
): boolean => {
    const differenceInDays = Math.abs(fromDate.diff(toDate, "days"));
    const isValidDates = differenceInDays > allowedRange ? false : true;
    return isValidDates;
};
