#!/bin/bash

clj --main cljs.main --compile-opts cljsc_opts.edn --compile ledger-charts.core
