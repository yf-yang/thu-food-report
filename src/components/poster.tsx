"use client";

import { cn } from "@/lib/utils";
import { ForwardedRef, forwardRef, PropsWithChildren } from "react";
import * as d3 from "d3";
import { Cell, Pie, PieChart } from "recharts";

export type ReportData = Awaited<
  ReturnType<typeof import("@/action")["genReport"]>
>;

export const PosterBasicStats = forwardRef(function PosterBasicStats(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const { totalAmount, totalMeals, numUniqueCafeterias, numUniqueStalls } =
    data;

  return (
    <Container ref={ref} className="bg-[#E7DFC6]">
      <TextContainer>
        <div>
          <NumberHighlight>2024</NumberHighlight>
          年是个值得回味的年份
        </div>
        <div className="mt-[10px] text-[12px]">在这一年里:</div>
        <div>
          你一共花了
          <NumberHighlight>{totalAmount / 100}</NumberHighlight>元
        </div>
        <div>
          细细品味了<NumberHighlight>{totalMeals}</NumberHighlight>
          顿美餐
        </div>
        <div>
          你走进
          <NumberHighlight>{numUniqueCafeterias}</NumberHighlight>
          个食堂
        </div>
        <div>
          探寻过<NumberHighlight>{numUniqueStalls}</NumberHighlight>
          个档口
        </div>
      </TextContainer>
      <Bottom>
        <div>有哪些特别的美食味道</div>
        <div>让你特别认可呢？</div>
      </Bottom>
    </Container>
  );
});

export const PosterFavorite = forwardRef(function PosterFavorite(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const { mostSpentCafeteria, mostSpentCafeteriaAmount, mostSpentStall } = data;
  const stall = mostSpentStall.split("_").slice(1).join("/");

  return (
    <Container ref={ref} className="bg-[#DAF76F]">
      <TextContainer className="mt-[50px]">
        <div>
          <LocationHighlight>{mostSpentCafeteria}</LocationHighlight>
          是你最慷慨投入的地方
        </div>
        <div>
          你在那共花费
          <NumberHighlight>{mostSpentCafeteriaAmount / 100}</NumberHighlight>元
        </div>
        <div className="text-right">
          <div className="mt-[50px]">其中，让你情有独钟的</div>
          <div>
            <LocationHighlight className="text-[30px]">
              {stall}
            </LocationHighlight>
            档口
          </div>
          <div>是不是你心中的华子最佳</div>
        </div>
      </TextContainer>
    </Container>
  );
});

export const PosterMeanCost = forwardRef(function PosterMeanCost(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    mostCostlyCafeteria,
    mostCostlyCafeteriaCost,
    mostCheapCafeteria,
    mostCheapCafeteriaCost,
  } = data;

  return (
    <Container ref={ref} className="bg-[#F9E98F]">
      <TextContainer>
        <div className="mt-[50px]">
          <LocationHighlight>{mostCostlyCafeteria}</LocationHighlight>
          是你去过最贵的食堂
        </div>
        <div>
          平均每顿花
          <NumberHighlight>
            {Math.round(mostCostlyCafeteriaCost) / 100}
          </NumberHighlight>
          元
        </div>
        <div className="text-right">
          <div className="mt-[50px]">
            <LocationHighlight>{mostCheapCafeteria}</LocationHighlight>
            是你去过最便宜的食堂
          </div>
          <div>
            平均每顿花
            <NumberHighlight>
              {Math.round(mostCheapCafeteriaCost) / 100}
            </NumberHighlight>
            元
          </div>
        </div>
      </TextContainer>
      <Bottom>该省就省，该花就花</Bottom>
    </Container>
  );
});

export const PosterHabit = forwardRef(function PosterHabit(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const { breakfastMostFrequent, lunchMostFrequent, dinnerMostFrequent } = data;

  const formatTime = ({
    hour,
    minute,
    count,
  }: {
    hour: number;
    minute: number;
    count: number;
  }) => {
    if (count === 0) {
      return "";
    }
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")} ~ ${(minute === 30 ? hour + 1 : hour)
      .toString()
      .padStart(2, "0")}:${minute === 30 ? "00" : "30"}`;
  };

  return (
    <Container ref={ref} className="bg-[#E9F1F7]">
      <TextContainer>
        <div className="mt-[10px]">
          {breakfastMostFrequent.count === 0 ? (
            <div className="py-[16px]">你未曾吃过一顿早餐</div>
          ) : (
            <>
              你总在
              <div>
                <LocationHighlight>
                  {formatTime(breakfastMostFrequent)}
                </LocationHighlight>
              </div>
              享用早餐
            </>
          )}
        </div>
        <div className="text-right">
          {lunchMostFrequent.count === 0 ? (
            <div className="py-[16px]">你未曾吃过一顿午餐</div>
          ) : (
            <>
              你总在
              <div>
                <LocationHighlight>
                  {formatTime(lunchMostFrequent)}
                </LocationHighlight>
              </div>
              享用午餐
            </>
          )}
        </div>
        <div>
          {dinnerMostFrequent.count === 0 ? (
            <div className="py-[16px]">你未曾吃过一顿晚餐</div>
          ) : (
            <>
              你总在
              <div>
                <LocationHighlight>
                  {formatTime(dinnerMostFrequent)}
                </LocationHighlight>
              </div>
              享用晚餐
            </>
          )}
        </div>
      </TextContainer>
      <Bottom>
        <div>规律的生活让你精力充沛</div>
        <div>为祖国健康工作五十年</div>
      </Bottom>
    </Container>
  );
});

export const PosterFirstMeal = forwardRef(function PosterFirstMeal(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    newYearFirstMeal: { date, cafeteria },
  } = data;

  return (
    <Container
      ref={ref}
      className="bg-[#623CEA] group darkBackground text-gray-100"
    >
      <TextContainer className="text-center mt-[70px]">
        <div>
          <DateHighlight date={date} />
        </div>
        <div>
          你在
          <LocationHighlight className="text-[30px]">
            {cafeteria}
          </LocationHighlight>
          吃下了
        </div>
        {date > new Date(2024, 7, 1) ? (
          <>
            <div>
              属于你的<span className="text-[24px] text-cyan-300">第一顿</span>
              华子饭
            </div>
            <div>第一餐的味道怎么样？</div>
          </>
        ) : (
          <>
            <div>
              龙年新年后的
              <span className="text-[24px] text-cyan-300">第一顿</span>华子饭
            </div>
            <div>
              看来你对<LocationHighlight>{cafeteria}</LocationHighlight>
              有别样的感情
            </div>
          </>
        )}
      </TextContainer>
    </Container>
  );
});

export const PosterEarliestAndLatest = forwardRef(
  function PosterEarliestAndLatest(
    {
      data,
    }: {
      data: ReportData;
    },
    ref: ForwardedRef<HTMLDivElement>
  ) {
    const { earliest, latest } = data;

    return (
      <Container ref={ref} className="bg-[#E9F1F7]">
        <TextContainer>
          <div className="mt-[50px]">
            <DateHighlight date={earliest} />
            <div>
              你在
              <TimeHighlight date={earliest} />
              就起来吃早饭了
            </div>
            <div>那是为了早课、考试，还是什么</div>
          </div>
          <div className="mt-[50px] text-right">
            <DateHighlight date={latest} />
            <div>
              <TimeHighlight date={latest} />
              的食堂里还有你的身影
            </div>
            <div>又有什么特别原因吗</div>
          </div>
        </TextContainer>
      </Container>
    );
  }
);

export const PosterMostExpensive = forwardRef(function PosterMostExpensive(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    mostExpensiveMealDate,
    mostExpensiveMealAmount,
    mostExpensiveMealCafeteria,
  } = data;

  return (
    <Container ref={ref} className="bg-[#F9E98F]">
      <TextContainer>
        <div className="text-center mt-[40px]">
          <div>
            <DateHighlight date={mostExpensiveMealDate} />在
            <LocationHighlight>{mostExpensiveMealCafeteria}</LocationHighlight>
          </div>
          <div>
            你一顿饭花了
            <NumberHighlight>{mostExpensiveMealAmount / 100}</NumberHighlight>元
          </div>
          <div className="my-[20px] text-[24px]">这顿饭的味道如何?</div>
          <div>你是在与朋友共享欢笑</div>
          <div>还是在犒赏辛苦的自己</div>
        </div>
      </TextContainer>
    </Container>
  );
});

export const PosterMostNumStalls = forwardRef(function PosterMostNumStalls(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    mostNumStallsMealDate,
    mostNumStallsMealStalls,
    mostNumStallsCafeteria,
  } = data;

  return (
    <Container ref={ref} className="bg-[#DAF76F]">
      <TextContainer>
        <div className="text-center mt-[70px]">
          <div>
            <DateHighlight date={mostNumStallsMealDate} />在
            <LocationHighlight>{mostNumStallsCafeteria}</LocationHighlight>
          </div>
          <div>
            你一顿饭吃了
            <NumberHighlight>{mostNumStallsMealStalls}</NumberHighlight>个档口
          </div>
          <div className="mt-[20px]">是什么</div>
          <div className="mb-[20px] text-[24px]">让那天的你胃口大开</div>
        </div>
      </TextContainer>
    </Container>
  );
});

export const PosterVisitedDays = forwardRef(function PosterVisitedDays(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    numVisitedDates,
    maxConsecutiveNoRecordDateBegin,
    maxConsecutiveNoRecordDateEnd,
    maxConsecutiveNoRecordDays,
  } = data;

  return (
    <Container ref={ref} className="bg-[#E7DFC6]">
      <TextContainer>
        <div className="text-center mt-[80px]">
          <div>今年，华子食堂陪你度过了</div>
          <div>
            <NumberHighlight>{numVisitedDates}</NumberHighlight>天
          </div>
          {maxConsecutiveNoRecordDays === 0 ? (
            <>
              <div>除去假期</div>
              <div>每天都能在华子食堂看到你的身影</div>
            </>
          ) : maxConsecutiveNoRecordDateBegin ===
            maxConsecutiveNoRecordDateEnd ? (
            <>
              <div>
                <DateHighlight
                  date={new Date(maxConsecutiveNoRecordDateBegin!)}
                />
              </div>
              <div>没有华子食堂的那一天</div>
              <div>你吃的怎么样</div>
            </>
          ) : (
            <>
              <div>
                从
                <DateHighlight
                  date={new Date(maxConsecutiveNoRecordDateBegin!)}
                />
                到
                <DateHighlight
                  date={new Date(maxConsecutiveNoRecordDateEnd!)}
                />
              </div>
              <div>没有华子食堂的那些天</div>
              <div>你吃的怎么样</div>
            </>
          )}
        </div>
      </TextContainer>
    </Container>
  );
});

export const PosterScore = forwardRef(function PosterScore(
  {
    data,
  }: {
    data: ReportData;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const score =
    data.totalAmount * 0.00003 +
    data.totalMeals * 0.01 +
    data.numUniqueCafeterias * 6;

  const rank = ((score: number) => {
    if (score >= 100) {
      return "A+";
    } else if (score >= 95) {
      return "A";
    } else if (score >= 90) {
      return "A-";
    } else if (score >= 85) {
      return "B+";
    } else if (score >= 80) {
      return "B";
    } else if (score >= 77) {
      return "B-";
    } else if (score >= 73) {
      return "C+";
    } else if (score >= 70) {
      return "C";
    } else if (score >= 67) {
      return "C-";
    } else if (score >= 63) {
      return "D+";
    } else if (score >= 60) {
      return "D";
    } else {
      return "?";
    }
  })(score);

  const dataVisulization = (data: ReportData) => {
    const cafeteriasSpent = data.cafeteriasSpent.map((d) => {
      return {
        ...d,
        amount: d.amount / data.totalAmount,
      };
    });

    const renderLabel = (
      {
        cx,
        cy,
        midAngle,
        innerRadius, // eslint-disable-line @typescript-eslint/no-unused-vars
        outerRadius,
        percent,
        index,
      }: any // eslint-disable-line @typescript-eslint/no-explicit-any
    ) => {
      // const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const radius = outerRadius * 1.1;
      const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
      const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

      return (
        <text
          x={x}
          y={y}
          fill="black"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          className="text-[10px]"
        >
          {percent > 0.1 ? `${cafeteriasSpent[index].cafeteria}` : ""}
        </text>
      );
    };

    return (
      <PieChart width={200} height={120}>
        <Pie
          data={cafeteriasSpent}
          dataKey="amount"
          nameKey="cafeteria"
          cx="50%"
          cy="50%"
          outerRadius={50}
          label={renderLabel}
          labelLine={false}
        >
          {cafeteriasSpent.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={d3.schemePastel1[index % 9]} />
          ))}
        </Pie>
      </PieChart>
    );
  };

  return (
    <Container ref={ref} className="bg-[#FDCBD3]">
      <TextContainer>
        <div className="text-center mt-[20px]">
          <div>我的 2024 《日肥学导论》成绩单</div>
        </div>
        <div className="flex flex-row justify-between mt-[20px] mx-[5px]">
          <div className="text-left flex flex-col justify-between w-40">
            <div>总消费金额: {data.totalAmount * 0.01}</div>
            <div>吃食堂顿数: {data.totalMeals}</div>
            <div>打卡食堂数: {data.numUniqueCafeterias}</div>
          </div>
          <div className="text-center">
            <div>
              总分:
              <NumberHighlight>
                {score > 100 ? 100 : score.toFixed(1)}
              </NumberHighlight>
            </div>
            <div>
              评级:<NumberHighlight>{rank}</NumberHighlight>
            </div>
          </div>
        </div>
        <div className="flex justify-center">{dataVisulization(data)}</div>
      </TextContainer>
    </Container>
  );
});

const Container = forwardRef(function Container(
  { children, className }: PropsWithChildren<{ className?: string }>,
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <div className={cn("size-[300px] border border-gray-300 rounded")}>
      <div className={cn("size-full", className)} ref={ref}>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
});

function TextContainer({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "text-left font-shuHeiTi text-[16px] top-[8px] w-full px-[8px]",
        className
      )}
    >
      {children}
    </div>
  );
}

function NumberHighlight({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "text-[30px] mx-[2px] text-purple-500 group-[.darkBackground]:text-cyan-300",
        className
      )}
    >
      {children}
    </span>
  );
}

function LocationHighlight({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "text-[20px] mx-[2px] text-purple-500 group-[.darkBackground]:text-cyan-300",
        className
      )}
    >
      {children}
    </span>
  );
}

function DateHighlight({
  date,
  className,
}: {
  date: Date;
  className?: string;
}) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (
    <>
      <span
        className={cn(
          "text-[20px] mx-[2px] text-purple-500 group-[.darkBackground]:text-cyan-300",
          className
        )}
      >
        {month}
      </span>
      月
      <span
        className={cn(
          "text-[20px] mx-[2px] text-purple-500 group-[.darkBackground]:text-cyan-300",
          className
        )}
      >
        {day}
      </span>
      日
    </>
  );
}

function TimeHighlight({
  date,
  className,
}: {
  date: Date;
  className?: string;
}) {
  return (
    <>
      <span
        className={cn(
          "text-[20px] mx-[2px] text-purple-500 group-[.darkBackground]:text-cyan-300",
          className
        )}
      >
        {date.getHours().toString().padStart(2, "0")}
      </span>
      :
      <span
        className={cn(
          "text-[20px] mx-[2px] text-purple-500 group-[.darkBackground]:text-cyan-300",
          className
        )}
      >
        {date.getMinutes().toString().padStart(2, "0")}
      </span>
    </>
  );
}

function Bottom({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "text-center text-[10px] font-shuHeiTi absolute bottom-[8px] whitespace-nowrap",
        className
      )}
    >
      {children}
    </div>
  );
}
