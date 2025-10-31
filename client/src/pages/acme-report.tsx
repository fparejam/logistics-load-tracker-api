import { Layout } from "@/components/layout";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcmeReport() {
  // Calculate current week (Monday to Sunday)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  
  // Format for API (ISO strings)
  const startDate = useMemo(() => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }, [weekStart]);
  
  const endDate = useMemo(() => {
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }, [weekEnd]);

  // Fetch weekly data
  const weeklyData = useQuery(api.call_metrics.getSummary, {
    start_date: startDate,
    end_date: endDate,
  });

  const outcomeBreakdown = useQuery(api.call_metrics.getOutcomeBreakdown, {
    start_date: startDate,
    end_date: endDate,
  });

  const agentMetrics = useQuery(api.call_metrics.getAgentMetrics, {
    start_date: startDate,
    end_date: endDate,
  });

  const winsSegmented = useQuery(api.call_metrics.getWinsSegmented, {
    start_date: startDate,
    end_date: endDate,
  });

  const priceDisagreementBreakdown = useQuery(api.call_metrics.getPriceDisagreementBreakdown, {
    start_date: startDate,
    end_date: endDate,
  });

  const noFitBreakdown = useQuery(api.call_metrics.getNoFitBreakdown, {
    start_date: startDate,
    end_date: endDate,
  });

  const isLoading = weeklyData === undefined || outcomeBreakdown === undefined || 
                    agentMetrics === undefined || winsSegmented === undefined ||
                    priceDisagreementBreakdown === undefined || noFitBreakdown === undefined;

  // Helper functions
  const getWinRateStatus = (rate: number) => {
    const pct = rate * 100;
    if (pct >= 70) return "excellent";
    if (pct >= 50) return "acceptable";
    return "needs improvement";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return "very positive";
    if (score > 0.1) return "positive";
    if (score < -0.1) return "negative";
    return "neutral";
  };

  const formatDateRange = () => {
    return `${format(weekStart, "MMMM d")} through ${format(weekEnd, "MMMM d, yyyy")}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Report Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900">Weekly Performance Report</h1>
            <p className="text-lg text-gray-600 mb-4">
              Reporting period: {formatDateRange()}
            </p>
            <p className="text-sm text-gray-500">
              Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-10 prose prose-lg max-w-none">
              {/* Executive Summary */}
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  <p>
                    During the week of {formatDateRange()}, our call center processed a total of{" "}
                    <strong className="font-semibold text-gray-900">{weeklyData?.total_calls || 0} calls</strong>. 
                    The overall performance this week demonstrates{" "}
                    <strong className="font-semibold text-gray-900">
                      {weeklyData && (weeklyData.win_rate * 100).toFixed(1)}% win rate
                    </strong>
                    , which represents {getWinRateStatus(weeklyData?.win_rate || 0)} performance compared to our benchmarks.
                  </p>
                  <p>
                    The average final negotiated rate for successful calls was{" "}
                    <strong className="font-semibold text-gray-900">
                      ${weeklyData?.avg_final ? Math.round(weeklyData.avg_final).toLocaleString() : "0"}
                    </strong>
                    , representing an average uplift of{" "}
                    <strong className="font-semibold text-gray-900">
                      {weeklyData?.avg_uplift_pct 
                        ? `${weeklyData.avg_uplift_pct >= 0 ? "+" : ""}${(weeklyData.avg_uplift_pct * 100).toFixed(1)}%`
                        : "0%"}
                    </strong>{" "}
                    compared to the initial listed rates. Customer sentiment analysis indicates a{" "}
                    <strong className="font-semibold text-gray-900">
                      {getSentimentLabel(weeklyData?.sentiment_score || 0)}
                    </strong>{" "}
                    overall sentiment score, reflecting customer satisfaction with agent interactions during this period.
                  </p>
                </div>
              </section>

              {/* Call Outcomes Analysis */}
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Call Outcomes Analysis</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {outcomeBreakdown && outcomeBreakdown.total > 0 ? (
                    <>
                      <p>
                        Of the {outcomeBreakdown.total} total calls processed this week,{" "}
                        <strong className="font-semibold text-gray-900">
                          {outcomeBreakdown.won_transferred} calls ({((outcomeBreakdown.won_transferred / outcomeBreakdown.total) * 100).toFixed(1)}%)
                        </strong>{" "}
                        resulted in successful transfers. These wins represent the core revenue-generating activities of our operation.
                      </p>
                      <p>
                        We experienced{" "}
                        <strong className="font-semibold text-gray-900">
                          {outcomeBreakdown.no_agreement_price} price disagreement outcomes ({((outcomeBreakdown.no_agreement_price / outcomeBreakdown.total) * 100).toFixed(1)}%)
                        </strong>
                        , where customers declined to proceed due to pricing concerns. Additionally,{" "}
                        <strong className="font-semibold text-gray-900">
                          {outcomeBreakdown.no_fit_found} calls ({((outcomeBreakdown.no_fit_found / outcomeBreakdown.total) * 100).toFixed(1)}%)
                        </strong>{" "}
                        ended without finding a suitable match for the customer's requirements. This is the main reason for the low win rate, as it means we are not able to secure loads for the customer.
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No call outcome data available for this week.</p>
                  )}
                </div>
              </section>

              {/* Financial Performance */}
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Performance</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {weeklyData && weeklyData.avg_final > 0 ? (
                    <>
                      <p>
                        The average listed rate for loads we acquired this week was{" "}
                        <strong className="font-semibold text-gray-900">
                          ${Math.round(weeklyData.avg_listed).toLocaleString()}
                        </strong>
                        . Through negotiation with carriers, agents secured these loads at an average final rate of{" "}
                        <strong className="font-semibold text-gray-900">
                          ${Math.round(weeklyData.avg_final).toLocaleString()}
                        </strong>
                        , representing an average uplift of{" "}
                        <strong className="font-semibold text-gray-900">
                          {weeklyData.avg_uplift_pct >= 0 ? "+" : ""}
                          {(weeklyData.avg_uplift_pct * 100).toFixed(1)}%
                        </strong>
                        . This means we paid an average of{" "}
                        <strong className="font-semibold text-gray-900">
                          ${Math.round(weeklyData.avg_final - weeklyData.avg_listed).toLocaleString()} more
                        </strong>{" "}
                        than the listed rate per load. As a freight brokerage, maintaining low uplift is critical to preserving our profit margins when reselling these loads to carriers.
                      </p>
                      {winsSegmented && winsSegmented.total_wins > 0 && (
                        <p>
                          Analyzing our load acquisition efficiency,{" "}
                          <strong className="font-semibold text-gray-900">
                            {winsSegmented.low_uplift_wins} wins ({((winsSegmented.low_uplift_wins / winsSegmented.total_wins) * 100).toFixed(0)}%)
                          </strong>{" "}
                          were secured with an uplift of 10% or less, demonstrating excellent cost control and strong negotiation performance where agents successfully acquired loads close to listed rates. However,{" "}
                          <strong className="font-semibold text-gray-900">
                            {winsSegmented.high_uplift_wins} wins ({((winsSegmented.high_uplift_wins / winsSegmented.total_wins) * 100).toFixed(0)}%)
                          </strong>{" "}
                          required uplifts above 10%, which reduces our profit margins and indicates areas where we may need to improve negotiation tactics or reassess our pricing strategy for certain load types.
                        </p>
                      )}
                      <p>
                        Our cost management performance this week is{" "}
                        {weeklyData.avg_uplift_pct <= 0.1 
                          ? <strong className="font-semibold text-gray-900">excellent</strong>
                          : weeklyData.avg_uplift_pct <= 0.15
                          ? <strong className="font-semibold text-gray-900">acceptable, with room for improvement</strong>
                          : <strong className="font-semibold text-gray-900">concerning and requires immediate attention</strong>}
                        . Agents averaged{" "}
                        <strong className="font-semibold text-gray-900">
                          {weeklyData.avg_negotiation_rounds.toFixed(1)} negotiation rounds
                        </strong>{" "}
                        per call before securing loads. Lower uplifts while maintaining win rates are essential for maximizing profitability in our brokerage operations.
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No financial data available for this week.</p>
                  )}
                </div>
              </section>

              {/* Loss Analysis */}
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Loss Analysis</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {priceDisagreementBreakdown && priceDisagreementBreakdown.total > 0 && (
                    <>
                      <p>
                        This week, we lost{" "}
                        <strong className="font-semibold text-gray-900">
                          {priceDisagreementBreakdown.total} calls
                        </strong>{" "}
                        due to price disagreements. Analyzing the magnitude of these price gaps reveals that{" "}
                        <strong className="font-semibold text-gray-900">
                          {priceDisagreementBreakdown.small_gap} calls ({((priceDisagreementBreakdown.small_gap / priceDisagreementBreakdown.total) * 100).toFixed(0)}%)
                        </strong>{" "}
                        had small price gaps of 5% or less, suggesting these were potentially recoverable with improved negotiation tactics.{" "}
                        <strong className="font-semibold text-gray-900">
                          {priceDisagreementBreakdown.medium_gap} calls ({((priceDisagreementBreakdown.medium_gap / priceDisagreementBreakdown.total) * 100).toFixed(0)}%)
                        </strong>{" "}
                        had medium gaps between 5-10%, while{" "}
                        <strong className="font-semibold text-gray-900">
                          {priceDisagreementBreakdown.large_gap} calls ({((priceDisagreementBreakdown.large_gap / priceDisagreementBreakdown.total) * 100).toFixed(0)}%)
                        </strong>{" "}
                        had large gaps exceeding 10%, indicating significant pricing misalignment that may require strategic pricing review.
                      </p>
                    </>
                  )}
                  {noFitBreakdown && noFitBreakdown.total > 0 && (
                    <>
                      <p>
                        We also experienced{" "}
                        <strong className="font-semibold text-gray-900">
                          {noFitBreakdown.total} calls
                        </strong>{" "}
                        where no suitable match was found for the customer's requirements. In{" "}
                        <strong className="font-semibold text-gray-900">
                          {noFitBreakdown.few_loads} cases ({((noFitBreakdown.few_loads / noFitBreakdown.total) * 100).toFixed(0)}%)
                        </strong>{" "}
                        , agents offered only 1-2 load options, suggesting limited inventory availability.{" "}
                        <strong className="font-semibold text-gray-900">
                          {noFitBreakdown.multiple_loads} calls ({((noFitBreakdown.multiple_loads / noFitBreakdown.total) * 100).toFixed(0)}%)
                        </strong>{" "}
                        presented 3-5 options, while{" "}
                        <strong className="font-semibold text-gray-900">
                          {noFitBreakdown.many_loads} calls ({((noFitBreakdown.many_loads / noFitBreakdown.total) * 100).toFixed(0)}%)
                        </strong>{" "}
                        offered 6 or more load options but still did not result in a match, potentially indicating specific customer requirements or timing constraints.
                      </p>
                    </>
                  )}
                  {(!priceDisagreementBreakdown || priceDisagreementBreakdown.total === 0) && 
                   (!noFitBreakdown || noFitBreakdown.total === 0) && (
                    <p className="text-gray-500 italic">No loss data available for this week.</p>
                  )}
                </div>
              </section>

              {/* Agent Performance */}
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">HappyRobot AI Agent Performance Analysis</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {agentMetrics && agentMetrics.length > 0 ? (
                    agentMetrics.map((agent, idx) => {
                      const sentiment = getSentimentLabel(agent.avg_sentiment_score);
                      return (
                        <div key={idx} className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">HappyRobot Agent: {agent.agent_name}</h3>
                          <p>
                            HappyRobot AI Agent {agent.agent_name} handled{" "}
                            <strong className="font-semibold text-gray-900">{agent.total_calls} calls</strong>{" "}
                            this week, achieving a win rate of{" "}
                            <strong className="font-semibold text-gray-900">
                              {(agent.win_rate * 100).toFixed(1)}%
                            </strong>
                            . {agent.win_rate >= 0.7 && "This performance meets our target threshold of 70% and demonstrates strong effectiveness."}
                            {agent.win_rate >= 0.5 && agent.win_rate < 0.7 && "This performance is below our target threshold of 70% and needs improvement to meet our standards."}
                            {agent.win_rate < 0.5 && "This performance is significantly below our target threshold of 70% and requires immediate attention."}
                          </p>
                          <p>
                            On average, {agent.agent_name} required{" "}
                            <strong className="font-semibold text-gray-900">
                              {agent.avg_negotiation_rounds.toFixed(1)} negotiation rounds
                            </strong>{" "}
                            per call to reach a resolution. Customer sentiment analysis shows a{" "}
                            <strong className="font-semibold text-gray-900">{sentiment}</strong>{" "}
                            sentiment score for interactions with this agent, indicating{" "}
                            {agent.avg_sentiment_score > 0.3 
                              ? "very high customer satisfaction"
                              : agent.avg_sentiment_score > 0.1
                              ? "positive customer relationships"
                              : agent.avg_sentiment_score < -0.1
                              ? "potential areas for improvement in customer communication"
                              : "generally neutral customer feedback"}.
                          </p>
                          {agent.avg_uplift_pct > 0 && (
                            <p>
                              When securing loads, {agent.agent_name} paid an average uplift of{" "}
                              <strong className="font-semibold text-gray-900">
                                {agent.avg_uplift_pct >= 0 ? "+" : ""}
                                {agent.avg_uplift_pct.toFixed(1)}%
                              </strong>{" "}
                              above listed rates.{" "}
                              {agent.avg_uplift_pct <= 8 
                                ? "This demonstrates excellent cost control and strong negotiation skills, keeping acquisition costs low and preserving profit margins."
                                : agent.avg_uplift_pct <= 12
                                ? "This is higher than ideal and reduces profit margins. Reducing uplift while maintaining win rates should be a priority to improve profitability."
                                : agent.avg_uplift_pct <= 15
                                ? "This is concerning as it significantly reduces profit margins. Immediate focus on negotiation training and pricing strategies is needed to reduce acquisition costs."
                                : "This is problematic and severely impacts profitability. Urgent action is required to improve negotiation tactics and reduce acquisition costs."}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 italic">No agent performance data available for this week.</p>
                  )}
                </div>
              </section>

              {/* Next Steps  */}
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {weeklyData && outcomeBreakdown ? (
                    <>
                      <p>
                        <strong className="font-semibold text-gray-900">Platform Expansion & Agent Configuration Optimization:</strong>{" "}
                        Adding more HappyRobot AI Agents to the platform is critical for optimization. Based on current performance data, 
                        we need to systematically test and analyze how different users respond to variations in voice characteristics, 
                        negotiation aggressiveness levels, and communication styles. The data shows clear opportunities to reduce uplift 
                        while maintaining or improving conversion rates through targeted agent behavior adjustments. This systematic testing 
                        will help identify optimal configurations that maximize win rates, minimize cost (uplift), and maintain positive 
                        customer sentiment across different customer segments.
                      </p>
                      <p>
                        <strong className="font-semibold text-gray-900">Load Inventory Gap Analysis:</strong>{" "}
                        Conducting research into what loads we are currently not able to satisfy is essential for improving our win rate. 
                        We should analyze the{" "}
                        <strong className="font-semibold text-gray-900">
                          {noFitBreakdown?.total || 0} calls
                        </strong>{" "}
                        where no suitable match was found to identify patterns in equipment types, origin-destination pairs, timing 
                        requirements, or other load characteristics that are frequently requested but unavailable in our inventory. This 
                        analysis will inform strategic decisions about inventory expansion, carrier partnerships, or load acquisition 
                        priorities to address the most common gaps and reduce "no fit found" outcomes.
                      </p>
                      <p>
                        <strong className="font-semibold text-gray-900">Price Disagreement Pattern Analysis:</strong>{" "}
                        Analyzing the{" "}
                        <strong className="font-semibold text-gray-900">
                          {priceDisagreementBreakdown?.total || 0} price disagreement cases
                        </strong>{" "}
                        to identify patterns in load types, customer segments, or market conditions that frequently lead to pricing 
                        misalignment. Understanding these patterns will help refine our pricing strategy, improve initial rate offerings, 
                        and develop more effective negotiation approaches for different scenarios.
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No recommendations available for this week.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


