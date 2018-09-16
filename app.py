import sys
import subprocess
from datetime import datetime
from flask import Flask
from flask import render_template
from flask import request
import json

from helper.process_ledger import process_bal

app = Flask(__name__, static_url_path='/static')
ledgerfile = None

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/balance")
def month_bal():
    input_param = request.args.get('param')
    expense_raw = subprocess.check_output(["ledger", "-f",
                                           ledgerfile, "balance"] +
                                          input_param.split(' '))
    expense_processed = process_bal(expense_raw.decode("utf-8"))
    return json.dumps(expense_processed, indent=4)


if __name__ == "__main__":
    ledgerfile = sys.argv[1]
    print("Using ledger file: ", ledgerfile)
    app.run()
