import re
from datetime import datetime

def process_bal(input):
    """Return parsed ledger input
>>> test_input = '''
...          $ -10.00  A1
...           $-30.75    A1B1
...            $20.75    A1B3
...             $2.80
...        INR 100.00  A2
...            $0.70    A2B1
...            $0.60      A2B1C1
...            $0.50      A2B1C2
...            $0.40      A2B1C3
...            $0.30      A2B1C4
...            $0.20      A2B1C5
...            $0.10      A2B1C6
...        INR 100.00    A2B2
...            $10.00      A2B2C1
...          -$100.00  A3'''
>>> output = process_bal(test_input)
>>> len(output[1]['amounts'])
2
>>> len(output[1]['children'][0]['children'])
6
>>> len(output)
3
>>> test_input = '''
...        $10.00  A1
...         $5.00    A1B1
...         $5.00    A1B2'''
>>> process_bal(test_input)
[{'amounts': [{'currency': '$', 'amount': 10.0}], 'account': 'A1', 'children': [{'amounts': [{'currency': '$', 'amount': 5.0}], 'account': 'A1B1', 'children': []}, {'amounts': [{'currency': '$', 'amount': 5.0}], 'account': 'A1B2', 'children': []}]}]
"""
    input = input.strip().split('\n')
    parsed_tree = [] # parsed_tree: [{'amounts':[], 'account': '', 'children: [parsed_tree]}]
    parent_stack = []
    parent_stack.append(parsed_tree)

    current_amounts = []
    for line in input:
        parsed_amount = parse_amount(line)
        parsed_account = parse_account(line)
        if parsed_account['account'] == '':
            # multi currency account
            current_amounts.append(parsed_amount)
        else:
            current_amounts.append(parsed_amount)
            if parsed_account['level'] == len(parent_stack):
                pass
            elif parsed_account['level'] < len(parent_stack):
                level_diff = int(len(parent_stack) - parsed_account['level'])
                for i in range(level_diff):
                    parent_stack.pop()
            elif parsed_account['level'] > len(parent_stack):
                parent_stack.append(parent_stack[-1][-1]['children'])

            parent_stack[-1].append({
                'amounts': current_amounts,
                'account': parsed_account['account'],
                'children': []})
            current_amounts = []
    return parsed_tree

bal_parse_account_re = re.compile("[aA-zZ$]+ ?-?\d+.\d\d( +)([\w\-:]*( [\w\-:]+)?)")
def parse_account(line):
    """Return account and level and handle empty account
>>> parse_account("     $10.25  A1   ")
{'account': 'A1', 'level': 1}

>>> parse_account("     $10.25   ")
{'account': '', 'level': 0}

>>> parse_account("     $-10.25    A1A2   ")
{'account': 'A1A2', 'level': 2}

>>> parse_account("    $10.11      A1 A1   ")
{'account': 'A1 A1', 'level': 3}
    """
    parsed_account = bal_parse_account_re.findall(line)
    if len(parsed_account) > 0 and len(parsed_account[0][1]) > 0: # and len of account > 0
        whitespace, account, _dontcare = parsed_account[0]
        account_level = len(whitespace) / 2  # each level is indented by 2 spaces
        return {'level': account_level, 'account': account}
    else:
        return {'level': 0, 'account': ''}

bal_parse_amount_re = re.compile("([aA-zZ$]+) ?(-?\d+.\d\d)")
def parse_amount(line):
    """Return amount along with currency
>>> parse_amount("     $10.25  A1   ")
{'currency': '$', 'amount': 10.25}

>>> parse_amount("     $10.25   ")
{'currency': '$', 'amount': 10.25}

>>> parse_amount("     $-10.25  A1   ")
{'currency': '$', 'amount': -10.25}
    """
    parsed_amount = bal_parse_amount_re.findall(line)
    if len(parsed_amount) > 0:
        currency, amount = parsed_amount[0]
        return {"currency": currency, "amount": float(amount)}
    else:
        return {"currency": "", "amount": 0.00}

splitre = re.compile('  +') # split based on at least 2 spaces
def process_reg(input):
    # returns duration accounts tree list
    # ['<duration>': [
    #    '<account>': {
    #      'current': { '<unit>': 'value' },
    #      'running': { '<unit>': 'value' },
    #      'children': [accounts-tree]
    #    }
    #  ]
    # ]
    duration_accounts_tree_list = []
    last_account = None
    for line in input:
        line = line.strip()  # helps when fields are empty
        fields = splitre.split(line)
        if len(fields) == 1:
            # extra amount row in cumulative sum column
            running = parse_amount(fields[0])
            add_currency(last_account['running'], running)
        elif len(fields) == 2:
            # extra amount row
            current = parse_amount(fields[0])
            running = parse_amount(fields[1])
            add_currency(last_account['current'], current)
            add_currency(last_account['running'], running)
        elif len(fields) == 3:
            accounts = fields[0].split(':')
            current = parse_amount(fields[1])
            running = parse_amount(fields[2])
            add_currency(last_account['current'], current)
            add_currency(last_account['running'], running)
        elif len(fields) == 4:
            duration = parse_duration(fields[0])
            accounts = fields[1].split(':')
            current = parse_amount(fields[2])
            running = parse_amount(fields[3])
            add_currency(last_account['current'], current)
            add_currency(last_account['running'], running)
        else:
            raise("more than 4 fields parsed during processing registry")

def add_currency(store, input):
    """adds to existing currency or creates new
>>> add_currency({'$': 100}, {'currency': '$', 'amount': 10})
{'$': 110}
>>> add_currency({'$': 100}, {'currency': 'INR', 'amount': 10})
{'$': 100, 'INR': 10}
    """
    if input['currency'] in store:
        store[input['currency']] = store[input['currency']] + input['amount']
    else:
        store[input['currency']] = input['amount']
    return store

def parse_duration(input):
    """ returns [from-date - to-date] or [date - payee]
>>> parse_duration('18-May-01 - 18-May-31')
{'to': datetime.datetime(2018, 5, 31, 0, 0), 'from': datetime.datetime(2018, 5, 1, 0, 0)}
>>> parse_duration('18-May-01 A1B1')
{'payee': 'A1B1', 'from': datetime.datetime(2018, 5, 1, 0, 0)}
    """
    if ' - ' in input:
        # duration format
        from_, to = input.split(' - ')
        return {
            'from': datetime.strptime(from_, '%y-%b-%d'),
            'to': datetime.strptime(to, '%y-%b-%d')
        }
    else:
        # date payee format
        from_, payee = input.split(' ')
        return {
            'from': datetime.strptime(from_, '%y-%b-%d'),
            'payee': payee
        }

if __name__ == "__main__":
    import doctest
    doctest.testmod()
