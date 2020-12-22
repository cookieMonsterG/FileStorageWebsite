blueCounter = 0
array = [1,1,1,1,2,1,2,1,1,1,2,2,1,2,1,2,1]
for i in range(len(array)):
    if array[i] == 1:
        temp = array[blueCounter]
        array[blueCounter] = array[i]
        array[i] = temp
        blueCounter += 1

for i in array:
    print(i, end=" ")