#gets data from the db
#probides functions for the views to get data from the DB
#currently, that DB are json files output from scrapy 

import json, re


#returns a a list of objects of the given classholder
def openJsonDB(fileName):
    #open the file
    file = open(fileName)
    fileData = json.load(file)
    file.close()

    itemsList = []
    for data in fileData[:150]:
        itemsList.append(vapeShopDubaiHolder(data))

    return itemsList


#holder item for the vapeShopDubaiHolder website
class vapeShopDubaiHolder:
    #json item is a dict. it holds data of a single item from its page
    def __init__(self, jsonItem):
        #items that matches fully with one of the expected keywords
        self.name = jsonMatcher(jsonItem, ["name"])
        self.itemLink = jsonMatcher(jsonItem, ["link"])
        self.productImageLink = jsonMatcher(jsonItem, ["productImageLink"])
        self.brand = jsonMatcher(jsonItem, ['Brand Name', 'Brand', 'NBrand Name', 'Manufacturer'])
        self.flavor = jsonVariantMatcher(jsonItem, ['Flavor', 'Flavour', 'Flavor Type', 'Flavor Profile', 'Flavour Profile'],
                                            ['Flavor', 'Flavors'])
        
        #edge case
        #for key in ['Iced Berry Lemonade', 'Iced Berry Banana', 'Iced Berry Peach']:
        #    if key in jsonItem.keys():
        #        self.flavor = key

        #items that require regex to match, their value is a list of strings
        self.nic = jsonVariantMatcher(jsonItem, ['Nicotine Level', 'Nicotine', 'Strength', 'Nicotine strength availability'], 
                                                ['Nicotine Strength', 'Nicotine', 'Variant'], 
                                                '(\d\d?)', '(\d\d?)\ ?\ ?([mM][gG])')
        self.size = jsonVariantMatcher(jsonItem, ['Size, Bottle Size', 'Capacity', 'eLiquid in a bottle'], 
                                                 ['Size', 'Variant'],
                                                 '(\d\d?\d?)', '(\d\d?\d?)\ ?\ ?([mM][lL])')
        self.vgpg = jsonMatcher(jsonItem, ['VG/PG', 'Ratio', 'VG / PG ratio', 'Mix Ratio', 'VG/PG Ratio'],'(\d\d).*?(\d\d)')


        #variants, this is only for reference
        #['Nicotine Strength', 'Nicotine', 'Size', 'Variant', 'Flavor', 'Flavors']

    def __str__(self):
        return self.name

#expands on the jsonMatcher function by taking another list of keys
#this second list is expected to match items in the variant key value of the original dict
#regex are passed for each list
def jsonVariantMatcher(json, keyOptions_1, keyOptions_2, regex_1=None, regex_2=None):
    lst1 = jsonMatcher(json, keyOptions_1, regex_1)
    lst2 = jsonMatcher(json["variants"], keyOptions_2, regex_2)
    if len(lst1) == 0:
        return lst2
    elif len(lst2) == 0:
        return lst1
    else:
        return lst1 + lst2


#takes a dict item that represents an item's page on the website
#and a list of strings in which each string is an expected key in the dict
#for the expected value
#e.g. flavor's value can be stored in one of these keys 
#['Flavor', 'Flavour', 'Flavor Type', 'Flavor Profile', 'Flavour Profile']
#returns the value
#regex option is passed for keys that has spcific expected value
def jsonMatcher(json, keyOptions, regex=None):
    for keyOption in keyOptions:
        if keyOption in json.keys():
            if regex == None:
                return json[keyOption]
            else:
                if type(json[keyOption]) == str:
                    return re.findall(regex, json[keyOption])
                elif type(json[keyOption]) == list:
                    tmpLst = []
                    for value in json[keyOption]:
                        tmpLst.append(re.findall(regex, value))
                    return tmpLst
                else:
                    return[]
    return []