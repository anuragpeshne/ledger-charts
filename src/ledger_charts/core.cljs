(ns ledger-charts.core
  (:require [ledger-charts.dom :as dom]
            [ledger-charts.pie-chart :as pie-chart]))

(println "hello World from core")
(dom/domready (fn [event]
                (pie-chart/init)))
