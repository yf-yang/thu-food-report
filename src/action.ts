"use server";

// cSpell:ignore nolookalikes, arquero, idserial, servicehall, meraddr, mername, txamt, txcode, tradetype, txdate, groupby

import * as aq from "arquero";
import { op } from "arquero";
import { createDecipheriv } from "crypto";
import client from "./mongo";
import { customAlphabet } from 'nanoid';
import { nolookalikesSafe } from 'nanoid-dictionary';
import { redirect } from "next/navigation";

const createSessionKey = customAlphabet(nolookalikesSafe);

async function fetchData(id: string, serviceHall: string) {
  const url = new URL(
    "https://card.tsinghua.edu.cn/business/querySelfTradeList"
  );

  const data = [];

  let pageNumber = 0;
  const pageSize = 1000;
  const maxRetries = 3;

  while (true) {
    url.searchParams.set("pageNumber", pageNumber.toString());
    url.searchParams.set("pageSize", pageSize.toString());
    url.searchParams.set("starttime", "2024-01-01");
    url.searchParams.set("endtime", "2024-12-31");
    url.searchParams.set("idserial", id);
    url.searchParams.set("tradetype", "-1");

    let response;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(url.toString(), {
          method: "POST",
          headers: { Cookie: `servicehall=${serviceHall}` },
        });
        if (response.ok) break;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
      }
    }

    const json = await response!.json();

    const encryptedString = json["data"];

    const decryptedData = decryptAesEcb(encryptedString);

    const parsedData = JSON.parse(decryptedData);

    data.push(...parsedData["resultData"]["rows"]);

    if (parsedData["resultData"]["total"] < (pageNumber + 1) * pageSize) {
      break;
    }

    pageNumber++;
  }

  for (const row of data) {
    if (row["meraddr"] === "-") {
      // console.log(row);
      row["meraddr"] = row["mername"].split("_")[0];
    }
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

export async function createSession(formData: FormData) {
  const id = formData.get("id") as string;
  const serviceHall = formData.get("serviceHall") as string;
  const rawData = await fetchData(id, serviceHall);
  
  const db = client.db("food");
  const sessionKey = createSessionKey();
  const sessions = db.collection("sessions");
  await sessions.insertOne({ [sessionKey]: id });
  const data = db.collection("data");
  await data.updateOne(
    { [id]: { $exists: true } },
    { $set: { [id]: { rawData, lastUpdated: new Date() } } },
    { upsert: true }
  );
  redirect(`/report/${sessionKey}`);
}

export async function genReport(sessionKey: string) {
  const db = client.db("food");
  const sessions = db.collection("sessions");
  const data = db.collection("data");
  const session = await sessions.findOne({ [sessionKey]: { $exists: true } });
  if (!session) {
    throw new Error("missing");
  }
  const id = session[sessionKey];
  const doc = await data.findOne({ [id]: { $exists: true } });
  if (!doc) {
    throw new Error("missing");
  }
  const { rawData, lastUpdated } = doc[id];

  if (!rawData.length) {
    throw new Error("empty");
  }
  const dt = cleanDataFrame(createDataTable(rawData));
  const mdt = constructMealDataTable(dt);
  return { ...analyze(dt, mdt), lastUpdated };
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
      date: (d) => op.parse_date(d.date + "+08:00"),
    });
}

function cleanDataFrame(dt: aq.ColumnTable) {
  // stall should not container '饮水' and '淋浴' and '天猫' and '学生卡' and '打印'
  // XXX: Seems code 1210 are credits, other codes are debits. Any other credit codes?
  return dt.filter(
    (d) =>
      !op.match(d.stall, /饮水|淋浴|天猫|学生卡|打印|游泳|图书馆/, 0) &&
      d.code === "1210"
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
      meal = { ...row, stalls: [row.stall] };
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
      last = row;
      meal = { ...row, stalls: [row.stall] };
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
    ...favorite(dt, mdt),
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
    numUniqueCafeterias: number;
    numUniqueStalls: number;
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
function favorite(dt: aq.ColumnTable, mdt: aq.ColumnTable) {
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

  const spent = dt
    .groupby("cafeteria")
    .rollup({
      amount: op.sum("amount"),
    })
    .orderby(aq.desc("amount"));

  const { cafeteria: mostSpentCafeteria, amount: mostSpentCafeteriaAmount } =
    spent.object(0) as {
      cafeteria: string;
      amount: number;
    };

  // const spentCafeterias = spent.array("cafeteria") as string[];
  // const spentCafeteriasAmount = spent.array("amount") as number[];

  const cafeteriasSpent = spent.objects() as {
    cafeteria: string;
    amount: number;
  }[];

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
    cafeteriasSpent,
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

  // console.log("latest", latest);

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
    .object(0) as { hour?: number; minute?: number; count?: number };
  const breakfastMostFrequent = {
    hour: hour ?? 0,
    minute: minute ?? 0,
    count: count ?? 0,
  };

  ({ hour, minute, count } = halfHourFrequency
    .filter((d) => d.hour >= 11 && d.hour < 14)
    .object(0) as { hour?: number; minute?: number; count?: number });
  const lunchMostFrequent = {
    hour: hour ?? 0,
    minute: minute ?? 0,
    count: count ?? 0,
  };

  ({ hour, minute, count } = halfHourFrequency
    .filter((d) => d.hour >= 17)
    .object(0) as { hour?: number; minute?: number; count?: number });

  const dinnerMostFrequent = {
    hour: hour ?? 0,
    minute: minute ?? 0,
    count: count ?? 0,
  };

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
  const {
    date: mostExpensiveMealDate,
    amount: mostExpensiveMealAmount,
    cafeteria: mostExpensiveMealCafeteria,
  } = mdt.orderby(aq.desc("amount")).object(0) as {
    date: Date;
    amount: number;
    cafeteria: string;
  };
  return {
    mostExpensiveMealDate,
    mostExpensiveMealAmount,
    mostExpensiveMealCafeteria,
  };
}

function mostNumStallsMeal(_dt: aq.ColumnTable, mdt: aq.ColumnTable) {
  const {
    date: mostNumStallsMealDate,
    numStalls: mostNumStallsMealStalls,
    cafeteria: mostNumStallsCafeteria,
  } = mdt.orderby(aq.desc("numStalls")).object(0) as {
    date: Date;
    numStalls: number;
    cafeteria: string;
  };
  return {
    mostNumStallsMealDate,
    mostNumStallsMealStalls,
    mostNumStallsCafeteria,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function maxConsecutiveNoRecordDates(dt: aq.ColumnTable, _mdt: aq.ColumnTable) {
  const { uniqueDates } = dt
    .derive({
      dateStr: aq.escape(
        // @ts-expect-error -- it works
        (d) =>
          `2024-${(op.month(d.date) + 1).toString().padStart(2, "0")}-${op
            .date(d.date)
            .toString()
            .padStart(2, "0")} 00:00:00+08:00`
      ),
    })
    .rollup({ uniqueDates: op.array_agg_distinct("dateStr") })
    .object(0) as {
    uniqueDates: string[];
  };

  const numVisitedDates = uniqueDates.length;

  const validRanges = [
    [
      new Date("2024-01-01 00:00:00+08:00"),
      new Date("2024-01-08 00:00:00+08:00"),
    ],
    [
      new Date("2024-02-26 00:00:00+08:00"),
      new Date("2024-04-04 00:00:00+08:00"),
    ],
    [
      new Date("2024-04-07 00:00:00+08:00"),
      new Date("2024-04-30 00:00:00+08:00"),
    ],
    [
      new Date("2024-05-06 00:00:00+08:00"),
      new Date("2024-06-08 00:00:00+08:00"),
    ],
    [
      new Date("2024-06-11 00:00:00+08:00"),
      new Date("2024-06-17 00:00:00+08:00"),
    ],
    [
      new Date("2024-09-09 00:00:00+08:00"),
      new Date("2024-09-14 00:00:00+08:00"),
    ],
    [
      new Date("2024-09-18 00:00:00+08:00"),
      new Date("2024-10-01 00:00:00+08:00"),
    ],
    [
      new Date("2024-10-08 00:00:00+08:00"),
      new Date("2024-12-31 00:00:00+08:00") < new Date()
        ? new Date("2024-12-31 00:00:00+08:00")
        : new Date(),
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
      const dateStr = `2024-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")} 00:00:00+08:00`;
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
    numVisitedDates,
    maxConsecutiveNoRecordDateBegin,
    maxConsecutiveNoRecordDateEnd,
    maxConsecutiveNoRecordDays,
  };
}
