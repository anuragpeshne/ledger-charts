import re

class ProcessedData:
    def __init__():
        self.totals = []
        self.children = []

def process_bal(input):
    """Return parsed ledger input
>>> test_input = '''
...        $ -10.00  A1
...            $-30.75    A1B1
...            $20.75    A1B3
...            $2.80
...        INR 100.00  A2
...            $0.70    A2B1
...            $0.60      A2B1C1
...            $0.50      A2B1C2
...            $0.40      A2B1C3
...            $0.30      A2B1C4
...            $0.20      A2B1C5
...            $0.10      A2B1C6
...        INR 100.00    A2B2'''
>>> process_bal(test_input.strip().split('\\n'))
1
    """
    for line in input:
        print(line)
    return 1

if __name__ == "__main__":
    import doctest
    doctest.testmod()

