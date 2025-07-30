export const mapPredictionToString = (prediction: number): string => {
  const mapping: { [key: number]: string } = {
    0: "Very Low",
    1: "Low",
    2: "Below Average",
    3: "Average",
    4: "Above Average",
  };
  return mapping[prediction] || "Unknown";
};

export const mapAttentionPredictionToString = (prediction: number): string => {
  const mapping: { [key: number]: string } = {
    0: "Significant Concern",
    1: "Likely Concern",
    2: "Potential Concern",
    3: "Minimal Concern",
  };
  return mapping[prediction] || "Unknown";
};
