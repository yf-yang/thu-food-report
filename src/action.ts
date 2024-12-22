"use server";

import * as aq from "arquero";
import { op } from "arquero";
import { createDecipheriv } from "crypto";

export async function fetchData(id: string, serviceHall: string) {
  const url = new URL(
    "https://card.tsinghua.edu.cn/business/querySelfTradeList"
  );

  let data = [];

  let pageNumber = 0;
  let pageSize = 1000;

  while (true) {
    url.searchParams.set("pageNumber", pageNumber.toString());
    url.searchParams.set("pageSize", pageSize.toString());
    url.searchParams.set("starttime", "2024-01-01");
    url.searchParams.set("endtime", "2024-12-31");
    url.searchParams.set("idserial", id);
    url.searchParams.set("tradetype", "-1");

    console.log(url.toString());

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { Cookie: `servicehall=${serviceHall}` },
    });

    const json = await response.json();

    const encryptedString = json["data"];

    const decryptedData = decryptAesEcb(encryptedString);

    const parsedData = JSON.parse(decryptedData);

    data.push(...parsedData["resultData"]["rows"]);

    if (parsedData["resultData"]["total"] < (pageNumber + 1) * pageSize) {
      break;
    }

    pageNumber++;
  }

  return data;
}

function decryptAesEcb(encrypted: string) {
  const key = encrypted.substring(0, 16);
  const data = encrypted.substring(16);
  const dataBytes = Buffer.from(data, "base64");

  const decipher = createDecipheriv("aes-128-ecb", key, null);

  let decryptedData = decipher.update(dataBytes, undefined, "utf-8");

  decryptedData += decipher.final();

  return decryptedData;
}

export async function genReport(id: string, serviceHall: string) {
  const data = await fetchData(id, serviceHall);

  const dt = cleanDataFrame(createDataTable(data));
  const mdt = constructMealDataTable(dt);
  return analyze(dt, mdt);
}

const names = {
  // Transaction Date
  txdate: "date",
  // Merchant Address (Cafeteria)
  meraddr: "cafeteria",
  // Merchant Name (Stall)
  mername: "stall",
  // Transaction Amount(cents)
  txamt: "amount",
  // After Transaction Balance(cents)
  balance: "balance",
  // Transaction Type
  txcode: "code",
};

function createDataTable(rows: object[]) {
  return aq
    .from(rows, Object.keys(names))
    .rename(names)
    .derive({
      date: (d) => op.parse_date(d.date),
    });
}

function cleanDataFrame(dt: aq.ColumnTable) {
  // stall should not container '饮水' and '淋浴' and '天猫'
  // XXX: Seems code 1210 are credits, other codes are debits. Any other credit codes?
  return dt.filter(
    (d) => !op.match(d.stall, /饮水|淋浴|天猫/, 0) && d.code === "1210"
  );
}

function constructMealDataTable(dt: aq.ColumnTable) {
  type Row = {
    date: Date;
    cafeteria: string;
    amount: number;
    stall: string;
  };
  type MealRow = {
    date: Date;
    cafeteria: string;
    amount: number;
    stalls: string[];
  };
  let last: Row | null = null;
  let meal: MealRow | null = null;

  const meals = [];
  for (const _row of dt.orderby((d) => d.date)) {
    const row = _row as Row;
    if (meal === null) {
      last = row;
      meal = { ...row, stalls: [] };
      continue;
    }

    // Criteria for a meal:
    // - Same cafeteria
    // - Time difference < 60 minutes
    if (
      last!.cafeteria === row.cafeteria &&
      row.date.getTime() - last!.date.getTime() < 60 * 60 * 1000
    ) {
      meal.amount += row.amount;
      if (!meal.stalls.includes(row.stall)) {
        meal.stalls.push(row.stall);
      }
      last = row;
    } else {
      const { stalls, ...other } = meal;
      meals.push({ ...other, numStalls: stalls.length });
      last = null;
      meal = null;
    }
  }

  if (meal !== null) {
    const { stalls, ...other } = meal;
    meals.push({ ...other, numStalls: stalls.length });
  }

  return aq.from(meals, ["date", "cafeteria", "amount", "numStalls"]);
}

function analyze(dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  return {
    ...basicStats(dt, mdt),
    ...most(dt, mdt),
    ...cost(dt, mdt),
    ...time(dt, mdt),
    ...newYearFirstMeal(dt, mdt),
    ...mostExpensiveMeal(dt, mdt),
    ...mostNumStallsMeal(dt, mdt),
    ...maxConsecutiveNoRecordDates(dt, mdt),
  };
}

// Total transaction amount.
// Total meal count.
// Total cafeteria count.
// Total stall count.
function basicStats(dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const { totalAmount, numUniqueCafeterias, numUniqueStalls } = dt
    .rollup({
      totalAmount: op.sum("amount"),
      numUniqueCafeterias: op.distinct("cafeteria"),
      numUniqueStalls: op.distinct("stall"),
    })
    .object(0) as {
    totalAmount: number;
    numUniqueCafeterias: string[];
    numUniqueStalls: string[];
  };
  const { totalMeals } = mdt
    .rollup({
      totalMeals: op.count(),
    })
    .object(0) as {
    totalMeals: number;
  };
  return {
    totalAmount,
    totalMeals,
    numUniqueCafeterias,
    numUniqueStalls,
  };
}

// Most visited cafeteria.
// Most spent cafeteria.
// Most spent stall in the cafeteria.
function most(dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const { cafeteria: mostVisitedCafeteria, count: mostVisitedCafeteriaCount } =
    mdt
      .groupby("cafeteria")
      .rollup({
        count: op.count(),
      })
      .orderby(aq.desc("count"))
      .object(0) as {
      cafeteria: string;
      count: number;
    };

  const { cafeteria: mostSpentCafeteria, amount: mostSpentCafeteriaAmount } = dt
    .groupby("cafeteria")
    .rollup({
      amount: op.sum("amount"),
    })
    .orderby(aq.desc("amount"))
    .object(0) as {
    cafeteria: string;
    amount: number;
  };

  const { stall: mostSpentStall, amount: mostSpentStallAmount } = dt
    // @ts-expect-error -- it works
    .filter(aq.escape((d) => d.cafeteria === mostSpentCafeteria))
    .groupby("stall")
    .rollup({
      amount: op.sum("amount"),
    })
    .orderby(aq.desc("amount"))
    .object(0) as {
    stall: string;
    amount: number;
  };

  return {
    mostVisitedCafeteria,
    mostVisitedCafeteriaCount,
    mostSpentCafeteria,
    mostSpentCafeteriaAmount,
    mostSpentStall,
    mostSpentStallAmount,
  };
}

// Most costly cafeteria per meal.
// Most cheap cafeteria per meal.
function cost(_dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const meanCost = mdt
    .groupby("cafeteria")
    .rollup({
      cost: op.mean("amount"),
    })
    .orderby(aq.desc("cost"));

  const { cafeteria: mostCostlyCafeteria, cost: mostCostlyCafeteriaCost } =
    meanCost.object(0) as {
      cafeteria: string;
      cost: number;
    };
  const { cafeteria: mostCheapCafeteria, cost: mostCheapCafeteriaCost } =
    meanCost.object(meanCost.numRows() - 1) as {
      cafeteria: string;
      cost: number;
    };

  return {
    mostCostlyCafeteria,
    mostCostlyCafeteriaCost,
    mostCheapCafeteria,
    mostCheapCafeteriaCost,
  };
}

// Most frequent time to eat.
// Most early/late meal.
function time(_dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const withHourMinute = mdt.derive({
    hour: (d) => op.hours(d.date),
    minute: (d) => op.minutes(d.date),
  });

  const { date: earliest } = withHourMinute
    .orderby("hour", "minute")
    .object(0) as {
    date: Date;
  };

  const { date: latest } = withHourMinute
    .orderby(aq.desc("hour"), aq.desc("minute"))
    .object(0) as {
    date: Date;
  };

  // Breakfast: < 10:30
  // Lunch: 11:00 - 14:00
  // Dinner: > 17:00

  const halfHourFrequency = withHourMinute
    .derive({
      minute: (d) => op.floor(d.minute / 30) * 30,
    })
    .groupby("hour", "minute")
    .rollup({
      count: op.count(),
    })
    .orderby(aq.desc("count"));
  let { hour, minute, count } = halfHourFrequency
    .filter((d) => d.hour < 10)
    .object(0) as { hour: number; minute: number; count: number };
  const breakfastMostFrequent = { hour, minute, count };

  ({ hour, minute, count } = halfHourFrequency
    .filter((d) => d.hour >= 11 && d.hour < 14)
    .object(0) as { hour: number; minute: number; count: number });
  const lunchMostFrequent = { hour, minute, count };

  ({ hour, minute, count } = halfHourFrequency
    .filter((d) => d.hour >= 17)
    .object(0) as { hour: number; minute: number; count: number });

  const dinnerMostFrequent = { hour, minute, count };

  return {
    breakfastMostFrequent,
    lunchMostFrequent,
    dinnerMostFrequent,
    earliest,
    latest,
  };
}

function newYearFirstMeal(_dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  // >= 2024.2.10
  const { date, cafeteria } = mdt
    .filter(
      (d) =>
        op.month(d.date) > 2 ||
        (op.month(d.date) === 2 && op.date(d.date) >= 10)
    )
    .orderby("date")
    .object(0) as {
    date: Date;
    cafeteria: string;
  };
  return { newYearFirstMeal: { date, cafeteria } };
}

function mostExpensiveMeal(_dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const { date: mostExpensiveMealDate, amount: mostExpensiveMealAmount } = mdt
    .orderby(aq.desc("amount"))
    .object(0) as {
    date: Date;
    amount: number;
  };
  return { mostExpensiveMealDate, mostExpensiveMealAmount };
}

function mostNumStallsMeal(_dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const { date: mostNumStallsMealDate, stalls: mostNumStallsMealStalls } = mdt
    .orderby(aq.desc("numStalls"))
    .object(0) as {
    date: Date;
    stalls: string[];
  };
  return { mostNumStallsMealDate, mostNumStallsMealStalls };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function maxConsecutiveNoRecordDates(dt: aq.ColumnTable, _mdt: aq.ColumnTable) {
  const { uniqueDates } = dt
    .derive({
      dateStr: (d) => `${op.month(d.date) + 1}-${op.date(d.date)}`,
    })
    .rollup({ uniqueDates: op.array_agg_distinct("dateStr") })
    .object(0) as {
    uniqueDates: string[];
  };

  const validRanges = [
    [new Date("2024-01-01"), new Date("2024-01-08")],
    [new Date("2024-02-26"), new Date("2024-04-04")],
    [new Date("2024-04-07"), new Date("2024-04-30")],
    [new Date("2024-05-06"), new Date("2024-06-08")],
    [new Date("2024-06-11"), new Date("2024-06-17")],
    [new Date("2024-09-09"), new Date("2024-09-14")],
    [new Date("2024-09-18"), new Date("2024-10-01")],
    [
      new Date("2024-10-08"),
      new Date("2024-12-31") < new Date() ? new Date("2024-12-31") : new Date(),
    ],
  ];

  let maxConsecutiveNoRecordDateBegin: string | null = null;
  let maxConsecutiveNoRecordDateEnd: string | null = null;
  let maxConsecutiveNoRecordDays = 0;
  let consecutiveNoRecordDateBegin: string | null = null;
  let consecutiveNoRecordDateEnd: string | null = null;
  let consecutiveNoRecordDays = 0;

  for (const [start, end] of validRanges) {
    for (let d = start; d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getMonth() + 1}-${d.getDate()}`;
      if (!uniqueDates.includes(dateStr)) {
        if (consecutiveNoRecordDateBegin === null) {
          consecutiveNoRecordDateBegin = dateStr;
        }
        consecutiveNoRecordDateEnd = dateStr;
        consecutiveNoRecordDays++;
      } else {
        if (consecutiveNoRecordDays > maxConsecutiveNoRecordDays) {
          maxConsecutiveNoRecordDays = consecutiveNoRecordDays;
          maxConsecutiveNoRecordDateBegin = consecutiveNoRecordDateBegin;
          maxConsecutiveNoRecordDateEnd = consecutiveNoRecordDateEnd;
        }
        consecutiveNoRecordDateBegin = null;
        consecutiveNoRecordDateEnd = null;
        consecutiveNoRecordDays = 0;
      }
    }

    if (consecutiveNoRecordDays > maxConsecutiveNoRecordDays) {
      maxConsecutiveNoRecordDays = consecutiveNoRecordDays;
      maxConsecutiveNoRecordDateBegin = consecutiveNoRecordDateBegin;
      maxConsecutiveNoRecordDateEnd = consecutiveNoRecordDateEnd;
    }
    consecutiveNoRecordDateBegin = null;
    consecutiveNoRecordDateEnd = null;
    consecutiveNoRecordDays = 0;
  }

  return {
    maxConsecutiveNoRecordDateBegin,
    maxConsecutiveNoRecordDateEnd,
  };
}
