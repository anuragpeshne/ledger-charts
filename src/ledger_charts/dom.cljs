(ns ledger-charts.dom)

(def pie-canvas (.getElementById js/document "pie-canvas"))

(defn domready [handler]
  (.addEventListener js/window "DOMContentLoaded" handler))
