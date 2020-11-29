import sys
import subprocess
from flask import Flask
from flask import render_template
from flask import request
import json

app = Flask(__name__, static_url_path='/static')
ledgerfile = None
SPLITTER = "|"

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/csv")
def csv():
    input_param = request.args.get('param').strip()
    expense_raw = subprocess.check_output(["ledger",
                                           "-f", ledgerfile,
                                           "csv"] +
                                          input_param.split(' ')).decode("utf-8")
    print(expense_raw)
    expense_processed = parse_csv(expense_raw)
    print(expense_processed)
    return json.dumps(expense_processed, indent=4)

@app.route("/balance")
def balance():
    input_param = request.args.get('param').strip()
    expense_raw = subprocess.check_output(["ledger",
                                           "-f", ledgerfile,
                                           "balance",
                                           "--no-total",
                                           "--flat",
                                           "--format",
                                           "%(amount)" + SPLITTER + "%(account)\\n"] +
                                          input_param.split(' ')).decode("utf-8")
    print("raw", expense_raw)
    expense_processed = parse_balance(expense_raw)
    print(expense_processed)
    return json.dumps(expense_processed, indent=4)

@app.route("/register")
def register():
    input_param = request.args.get('param').strip()
    expense_raw = subprocess.check_output(["ledger",
                                           "-f", ledgerfile,
                                           "register",
                                           "--no-total",
                                           "--flat",
                                           "--format",
                                           SPLITTER.join(["%(date)", "%(account)", "%t", "%T\n"])] +
                                          input_param.split(' ')).decode("utf-8")
    print(expense_raw)
    expense_processed = parse_register(expense_raw)
    print(expense_processed)
    return json.dumps(expense_processed, indent=4)

def parse_register(raw):
    if empty(raw): return []
    rows = raw.strip().split("\n")
    parsed_rows = []
    for row in rows:
        splits = row.split(SPLITTER)
        first_col = splits[0]
        if not is_date(first_col):
            if len(parsed_rows) == 0:
                raise "empty parsed_rows: trailing amount needs to be added to last row."
            amount = splits[0]
            amount = parse_amount(amount)
            parsed_rows[-1]["running_sum"].append(amount)
        elif len(splits) > 1:
            print(splits)
            if len(splits) == 3:
                date, account, amount = splits
                running_sum_list = []
            else:
                date, account, amount, running_sum = splits
                running_sum = parse_amount(running_sum)
                running_sum_list = [running_sum]
            amount = parse_amount(amount)
            parsed_rows.append(
                {
                    "date": date,
                    "account": account,
                    "amount": [amount],
                    "running_sum": running_sum_list
                })
        else:
            print("error reading line: " + row)
    return parsed_rows

def parse_balance(raw):
    if empty(raw): return []
    rows = raw.strip('"').strip().split("\n")
    parsed_rows = []
    carry_over = []
    for row in rows:
        splits = row.split(SPLITTER)
        amount = splits[0].strip('"')
        amount = parse_amount(amount)
        account = splits[1] if len(splits) > 1 else None
        if account:
            amount_list = [amount]
            if len(carry_over) > 0:
                amount_list.extend(carry_over)
                carry_over = []

            parsed_rows.append(
            {
                "amount": amount_list,
                "account": account
            })
        else:
            carry_over.append(amount)
    return parsed_rows

def parse_csv(raw):
    rows = raw.split("\n")
    parsed_rows = []
    for row in rows:
        splits = row.split(",")
        if len(splits) > 1:
            parsed_rows.append(
                {
                    "date": splits[0],
                    "payee": splits[2],
                    "account": splits[3],
                    "commodity": splits[4],
                    "quantity": splits[5]
                })
    return parsed_rows

def parse_amount(raw_amount):
    if '$' in raw_amount:
        amount = float(raw_amount[1:].replace(',',''))
        return {'commodity': '$', 'amount': amount}
    else:
        splits = raw_amount.split(' ')
        print("xyzzy")
        print(raw_amount, splits)
        amount_str = splits[0]
        amount = float(amount_str.replace(',',''))
        commodity = splits[1] if amount != 0 else '$'
        return {'commodity': commodity, 'amount': amount}

def is_date(string):
    return '/' in string

def empty(string):
    return len(string.strip()) == 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python app.py <ledgerfile location>")
        exit(1)
    ledgerfile = sys.argv[1]
    print("Using ledger file: ", ledgerfile)
    app.run()
