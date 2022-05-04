import math

def valueFromBinary(binary_dna, start, min, max):  # 100..200
    resolution = (max - min) # 100
    length = math.floor(math.log2(resolution)) + 1 # 7
    binary_part = binary_dna[start:start + length]
    dna_raw_value = int(binary_part, base=2)  # 0..127
    max_value = 2 ** length - 1
    value = (dna_raw_value / max_value) * resolution # 0..100
    value += min  # 100..200
    return length, int(value)


def manhattan(a, b):
    return sum(abs(val1-val2) for val1, val2 in zip(a, b))


def dist(a, b):
    return math.sqrt(sum((val1-val2)**2 for val1, val2 in zip(a, b)))
