#gets data from the db
#probides functions for the views to get data from the DB
#currently, that DB are json files output from scrapy 
import json


#takes a json and returns the itemList to be added to the DB
def openJson(fileName, start=0, end=99999):
    with open(fileName) as file:
        fileData = json.load(file)
    return fileData['meta'], fileData['itemList'][start:end]
