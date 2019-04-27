import sys
import subprocess
from datetime import datetime
from flask import Flask
from flask import render_template
from flask import request
import json

from helper.parse_ledger import parse_balance
from helper.parse_ledger import parse_register

app = Flask(__name__, static_url_path='/static')
ledgerfile = None

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/balance")
def balance():
    input_param = request.args.get('param').strip()
    expense_raw = subprocess.check_output(["ledger", "-f",
                                           ledgerfile, "balance"] +
                                          input_param.split(' '))
    expense_processed = parse_balance(expense_raw.decode("utf-8"))
    return json.dumps(expense_processed, indent=4)

@app.route("/register")
def register():
    input_param = request.args.get('param').strip()
    expense_raw = subprocess.check_output(["ledger", "-f",
                                           ledgerfile, "register"] +
                                          input_param.split(' '))
    expense_processed = parse_register(expense_raw.decode("utf-8"))
    return json.dumps(expense_processed, indent=4)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python app.py <ledgerfile location>")
        exit(1)
    ledgerfile = sys.argv[1]
    print("Using ledger file: ", ledgerfile)
    app.run()
