import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any


class CampusAnomalyDetector:
    """
    Offline local Isolation Forest model for detecting spatial and sensor anomalies
    across campus building telemetry (occupancy, temperature, wifi devices, power).
    Runs 100% locally with zero external API calls or keys.
    """

    def __init__(self, contamination: float = 0.08, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model: IsolationForest = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=self.random_state,
        )
        self.is_trained: bool = False
        self._train_baseline()

    def _train_baseline(self):
        """
        Generate synthetic normal operating telemetry for 10 TIET building baselines
        and train the Isolation Forest model.
        Features: [occupancy_pct (10-80), temperature_c (20-25), wifi_devices (50-1000), power_kw (30-220)]
        """
        np.random.seed(self.random_state)
        n_samples = 1200

        # Normal operational distributions
        occupancies = np.random.normal(loc=55.0, scale=15.0, size=n_samples)
        occupancies = np.clip(occupancies, 10.0, 85.0)

        temperatures = np.random.normal(loc=23.0, scale=1.8, size=n_samples)
        temperatures = np.clip(temperatures, 19.0, 26.5)

        wifi_devices = np.random.normal(loc=550.0, scale=220.0, size=n_samples)
        wifi_devices = np.clip(wifi_devices, 50.0, 1100.0)

        power_kw = np.random.normal(loc=120.0, scale=45.0, size=n_samples)
        power_kw = np.clip(power_kw, 25.0, 220.0)

        X_train = np.column_stack([occupancies, temperatures, wifi_devices, power_kw])
        self.model.fit(X_train)
        self.is_trained = True

    def score(
        self,
        occupancy: float,
        temperature: float,
        wifi_devices: float,
        power_kw: float,
    ) -> Dict[str, Any]:
        """
        Score a single building telemetry vector.
        Returns:
            - is_anomaly (bool): True if classified as outlier by IsolationForest (-1)
            - score (float): 0.00 (completely normal) to 1.00 (extreme anomaly)
            - severity (str): 'normal', 'warning', or 'critical'
            - reason (str): Human-readable diagnostic description
        """
        if not self.is_trained:
            self._train_baseline()

        X = np.array([[occupancy, temperature, wifi_devices, power_kw]])
        pred = int(self.model.predict(X)[0])  # 1 for inlier, -1 for outlier
        dec_val = float(self.model.decision_function(X)[0])

        # Normalize decision function to [0.0, 1.0]
        # In scikit-learn, dec_val > 0 is inlier (normal), dec_val < 0 is outlier
        normalized_score = float(np.clip((0.15 - dec_val) / 0.35, 0.0, 1.0))
        normalized_score = round(normalized_score, 2)

        is_anomaly = pred == -1 or normalized_score >= 0.50

        # Determine severity and diagnostic reason
        reasons = []
        if occupancy > 88:
            reasons.append(f"Capacity overload ({occupancy}% occ)")
        if temperature > 27.5:
            reasons.append(f"Elevated thermal dissipation ({temperature}°C)")
        elif temperature < 17.0:
            reasons.append(f"Abnormally low temperature ({temperature}°C)")
        if wifi_devices > 1400:
            reasons.append(f"Dense radio client clustering ({wifi_devices} AP clients)")
        if power_kw > 270:
            reasons.append(f"High wattage spike ({power_kw} kW draw)")

        if not reasons and is_anomaly:
            reasons.append("Multivariate outlier: atypical correlation among sensor vectors")

        if normalized_score >= 0.75:
            severity = "critical"
        elif normalized_score >= 0.45 or is_anomaly:
            severity = "warning"
        else:
            severity = "normal"

        reason_str = "; ".join(reasons) if reasons else "Sensors operating within normal baseline."

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": normalized_score,
            "severity": severity,
            "decision_function": round(dec_val, 4),
            "reason": reason_str,
        }


# Global detector instance singleton
detector = CampusAnomalyDetector()
