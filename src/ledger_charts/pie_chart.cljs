(ns ledger-charts.pie-chart
  (:require [ledger-charts.dom :as dom]))

(def canvas-el (.getElementById js/document "pie-canvas"))
(def command-el (.getElementById js/document "pie-command"))
(def depth-el (.getElementById js/document "pie-depth"))

(defn- get-month-start-iso []
  (let [today (js/Date.)]
    (str (.getFullYear today) "/" (.getMonth today) "/" "01")))

(defn init []
  (let [month-start (get-month-start-iso)
        chart-init-command (str "-b" " " month-start)]
    (set! (.value command-el) chart-init-command)))
