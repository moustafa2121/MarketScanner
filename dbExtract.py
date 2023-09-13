#gets data from the db
#probides functions for the views to get data from the DB
#currently, that DB are json files output from scrapy 
import json, re

from sqlalchemy.orm import exc


#takes a json and returns the itemList to be added to the DB
def openJson(fileName, start=0, end=99999):
    with open(fileName) as file:
        fileData = json.load(file)
    return fileData['meta'], fileData['itemList'][start:end]

#delete
#takes the name of json filename
#returns a a list of objects of the given classholder
def openJsonDB(fileName, start=0, end=99999):
    #open the file
    file = open(fileName)
    fileData = json.load(file)
    file.close()

    itemsList = []
    for data in fileData[start:end]:
        itemsList.append(vapeHolder(data, jsonKeysTmp))

    return itemsList



#below is garbage, delete

jsonKeysTmp = {
    "name": ["name"],
    "itemLink": ["itemLink"],
    "productImageLink": ["productImageLink"],
    "brand": ['Brand Name', 'Brand', 'NBrand Name', 'Manufacturer'],
    "flavor": [['Flavor', 'Flavour', 'Flavor Type', 'Flavor Profile', 'Flavour Profile'],
                                        ['Flavor', 'Flavors']],
    "nic" : [['Nicotine Level', 'Nicotine', 'Strength', 'Nicotine strength availability'], 
                                            ['Nicotine Strength', 'Nicotine', 'Variant'], 
                                            '(\d\d?)', '(\d\d?)\ ?\ ?([mM][gG])'],
    "size":[['Size, Bottle Size', 'Capacity', 'eLiquid in a bottle'], 
                                                ['Size', 'Variant'],
                                                '(\d\d?\d?)', '(\d\d?\d?)\ ?\ ?([mM][lL])'],
    "vgpg": [['VG/PG', 'Ratio', 'VG / PG ratio', 'Mix Ratio', 'VG/PG Ratio'],'(\d\d).*?(\d\d)']
    }


#temporary implementation
#returns a list of dictionry from JSON
def getJsonFile(website):
    if website == "vapeShopDubai":
        #open the file
        import json
        file = open("static/vape-shop-dubai.json")
        fileData = json.load(file)
        file.close()

        #a dictionry that holds for each db field a list of keywords
        #that will be found in the json for each field
        return fileData, jsonKeysTmp


   

#holder item for the a vape
class vapeHolder:
    #json item is a dict. it holds data of a single item from its page
    def __init__(self, jsonItem, jsonKeys):
        #items that matches fully with one of the expected keywords
        #todo: more modular. the json matcher should know if one list or two are given or if there is regex or not
        self.name = jsonMatcher(jsonItem, jsonKeys["name"])
        self.itemLink = jsonMatcher(jsonItem, jsonKeys["itemLink"])
        self.productImageLink = jsonMatcher(jsonItem, jsonKeys["productImageLink"])
        self.brand = jsonMatcher(jsonItem, jsonKeys['brand'])
        self.flavor = jsonVariantMatcher(jsonItem, jsonKeys['flavor'][0], jsonKeys['flavor'][1])

        #items that require regex to match, their value is a list of strings
        self.nic = jsonVariantMatcher(jsonItem, jsonKeys['nic'][0], jsonKeys['nic'][1], jsonKeys['nic'][2], jsonKeys['nic'][3])
        self.size = jsonVariantMatcher(jsonItem, jsonKeys['size'][0], jsonKeys['size'][1], jsonKeys['size'][2], jsonKeys['size'][3])
        
        self.vgpg = jsonMatcher(jsonItem, jsonKeys['vgpg'][0], jsonKeys['vgpg'][1])


    def __str__(self):
        return self.name

#expands on the jsonMatcher function by taking another list of keys
#this second list is expected to match items in the variant key value of the original dict
#regex are passed for each list
def jsonVariantMatcher(jsonItem, keyOptions_1, keyOptions_2, regex_1=None, regex_2=None):
    lst1 = jsonMatcher(jsonItem, keyOptions_1, regex_1)
    lst2 = jsonMatcher(jsonItem["variants"], keyOptions_2, regex_2)
    if len(lst1) == 0 and len(lst2) == 0:
        return []
    elif type(lst1) != list:
        lst1 = [lst1]
    elif type(lst2) != list:
        lst2 = [lst2]
    return lst1 + lst2


#takes a dict item that represents an item's page on the website
#and a list of strings in which each string is an expected key in the dict
#for the expected value
#e.g. flavor's value can be stored in one of these keys 
#['Flavor', 'Flavour', 'Flavor Type', 'Flavor Profile', 'Flavour Profile']
#returns the value
#regex option is passed for keys that has spcific expected value
def jsonMatcher(jsonItem, keyOptions, regex=None):
    for keyOption in keyOptions:
        if keyOption in jsonItem.keys():
            if regex == None:#no regex
                return jsonItem[keyOption]
            else:#with regex
                if type(jsonItem[keyOption]) == str:
                    return re.findall(regex, jsonItem[keyOption])
                elif type(jsonItem[keyOption]) == list:
                    tmpLst = []
                    for value in jsonItem[keyOption]:
                        tmpLst.append(re.findall(regex, value))
                    return tmpLst
                else:
                    return[]
    return []