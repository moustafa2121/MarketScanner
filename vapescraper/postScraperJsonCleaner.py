import json, re, time

"""
This scripts takes place after scraping the items from the website
Its purpose is to take JSON from the scrape and creates a JSON that meets the standards
expected by the backend so it can be saved in the DB. the expected format is the following:

expected json format
{"meta":{"websiteName":websiteName as given by the website value is string max 100 chars,
       "websiteBase":the base url of the website value is string max 100 chars,
       "websiteIcon":full url link to the icon of the website value is string max 400 chars,
       "numberOfItems":number of items scraped value is an integer,
       "timestamp":epoch of the time in which the website was scraped}
       "itemList":[{
            "name":name as given value is string max 255 chars,
            "itemLink":the full url of the item value is string max 400 chars,
            "productImageLink":the full url of one image of the item value is string max 400 chars,
            "brand":the brand of the item value is string max 255 chars,
            "flavor": a list of flavors variants of the item value is string each max 100 chars,
            "nic": a list of nicotine variants of the item each value is an int 1 to 3 digits,
            "size": a list of size variants of the item each value is an int 1 to 3 digits,
            "vgpg": a list of vgpg variants of the item each value is a string of the format dd/dd,
            }]
            }

Note that this script has several methods that are meant to be used individually and modified
as needed until we can get all cases for each value. this is due to the websites having
poor structures and thus we rely on constant tweeking
"""

### Part 1: used to find what keywords match what variable
# for example the flavor of the item can be named as "flavor" or "flavour" or "variants"
# this is because lots of websites are not consistent in their structure
# and thus we have to get as much data as possible by trying to get all different keywords


#opens the json taken from the scraper
# and returns it as a list of dicts
def openJsonDB(fileName, start=0, end=99999):
    #open the file
    file = open(fileName)
    fileData = json.load(file)
    file.close()

    itemsList = []
    for data in fileData[start:end]:
        itemsList.append(data)

    return itemsList


#given a list of keywords of possible items and a regex
#prints out items that do not match the given regex
#its job is to make sure that data in the JSON that may match
#several keywords (i.e. name, Name, product name) will match the given
#regex and it will be in proper format
def patternChecker(listOfDict, expectedKeywords, expectedPattern):
    for item in listOfDict:
        for expectedKeyword in expectedKeywords:
            if expectedKeyword in item.keys():
                tmp = re.findall(expectedPattern, item[expectedKeyword])
                if len(tmp) == 0:#print the no match
                    print(item[expectedKeyword])

#same but for variants
def patternChecker_variants(listOfDict, expectedKeywords):
    for item in listOfDict:
        targetedDict = item['variants']#item
        for expectedKeyword in expectedKeywords:#for each keyword
            if expectedKeyword in targetedDict.keys():#check dict
                for value in targetedDict[expectedKeyword]:#loop over the values
                    mg = re.findall('(\d\d?)\ ?\ ?([mM][gG])', value)
                    ml = re.findall('(\d\d?)\ ?\ ?([mM][lL])', value)
                    if len(mg) == 0 and len(ml) == 0:#print the no match
                        if expectedKeyword == 'Flavor' or expectedKeyword == 'Flavors':
                            pass
                        else:
                            print('--------- ', value)
                            print(targetedDict)
                    
### Part 2: makes sure all different keywords has been met
#check variants keys
#it make sure that these keys cover all variants
"""
expectedKeywords = ['Nicotine Strength', 'Nicotine', 'Size', 'Variant', 'Flavor', 'Flavors']
for item in fileValue:
    fullCheck = False
    #check for all keywords for variants
    for expectedKeyword in expectedKeywords:
        if expectedKeyword in item["variants"].keys():
            fullCheck = True
            break
    if not fullCheck:
        print(item['variants'].keys())

#patternChecker_variants(fileValue, expectedKeywords)
        
db = {}
for item in x:
    for i, j in item.items():
        if i not in db.keys():
            db[i] = []
        db[i].append(j)
"""

#this is a dictionry of expected keys for each field
jsonKeys = {
    "name": ["name"],
    "itemLink": ["itemLink"],
    "productImageLink": ["productImageLink"],
    "brand": ['Brand Name', 'Brand', 'NBrand Name', 'Manufacturer'],
    "flavor": [['Flavor', 'Flavour', 'Flavor Type', 'Flavor Profile', 'Flavour Profile'],
                                        ['Flavor', 'Flavors']],
    "nic" : [['Nicotine Level', 'Nicotine', 'Strength', 'Nicotine strength availability'], 
                                            ['Nicotine Strength', 'Nicotine', 'Variant', 'Size'], 
                                            '(\d\d?)', '(\d\d?)\ ?\ ?[mM][gG]'],
    "size":[['Size, Bottle Size', 'Capacity', 'eLiquid in a bottle'], 
                                                ['Size', 'Variant'],
                                                '(\d\d?\d?)', '(\d\d?\d?)\ ?\ ?[mM][lL]'],
    "vgpg": [['VG/PG', 'Ratio', 'VG / PG ratio', 'Mix Ratio', 'VG/PG Ratio'],'(\d\d).*?(\d\d)']
    }


### Part 3: this part involves taking all the items, and matching each against the expected keywords
# some are fed with regex to be extracted
# some are expected to be found in the item or in the item['variants'] value
#items are then placed into a dict that matches the standards given at the start of the document

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




#takes a list of list in which the second list is one string item
#extracts these items and returns them in a list of integers
#also enforces uniqueness
def postRegexCleaner(lst):
    tmpSet = set()
    [tmpSet.add(int(i[0])) for i in lst if len(i)>0]
    return list(tmpSet)
def postRegexCleaner_vgpg(lst):
    tmpSet = set()
    [tmpSet.add((int(i[0]), int(i[1]))) for i in lst]
    return [str(item[0])+'/'+str(item[1]) for item in tmpSet]
def postRegexCleaner_brand(item):
    if type(item) is not str and type(item) is list:
        if len(item) == 0:
            return ''
        else:
            return item[0]
    else:
        return item

#read the original json
itemList = openJsonDB('vape-shop-dubai.json')

#the clean json to be saved
jsonOutput = {"meta":{"websiteName":"Vape Shop Dubai",
       "websiteBase":"https://vape-shop-dubai.net/",
       "websiteIcon":"https://vape-shop-dubai.net/cdn/shop/files/v_800_png-1_150x.png?v=1629028571",
       "numberOfItems":len(itemList),
       "timestamp":"1694020680"},
        "itemList":[]}

#clean each item of the original json
#append them to the itemList in the json output
for item in itemList:
    jsonOutput['itemList'].append({
        "name":jsonMatcher(item, jsonKeys["name"]),
        "itemLink":jsonMatcher(item, jsonKeys["itemLink"]),
        "productImageLink":jsonMatcher(item, jsonKeys["productImageLink"]),
        "brand":postRegexCleaner_brand(jsonMatcher(item, jsonKeys['brand'])),
        "flavor":jsonVariantMatcher(item, jsonKeys['flavor'][0], jsonKeys['flavor'][1]),
        "nic":postRegexCleaner(jsonVariantMatcher(item, jsonKeys['nic'][0], jsonKeys['nic'][1], jsonKeys['nic'][2], jsonKeys['nic'][3])),
        "size":postRegexCleaner(jsonVariantMatcher(item, jsonKeys['size'][0], jsonKeys['size'][1], jsonKeys['size'][2], jsonKeys['size'][3])),
        "vgpg":postRegexCleaner_vgpg(jsonMatcher(item, jsonKeys['vgpg'][0], jsonKeys['vgpg'][1]))
        })


#test case: https://vape-shop-dubai.net/collections/e-liquids-nic-salts/products/tokyo-ice-blueberry-saltnic-30ml-classic-series
   
#validate that the items match the expected standards for the json
#it records the index of the items that are not validated
#this does NOT check the meta values
validator = {"name": [],
             "itemLink":[],
             "productImageLink":[],
             "brand":[],
             "flavor":[],
             "nic":[],
             "size":[],
             "vgpg":[]}
            
for i, item in enumerate(jsonOutput['itemList']):
    if type(item['name']) is not str or len(item['name'])>255:
        validator['name'].append(i)
        
    if type(item['itemLink']) is not str or len(item['name'])>400:
        validator['itemLink'].append(i)
        
    if type(item['productImageLink']) is not str or len(item['productImageLink'])>400:
        validator['productImageLink'].append(i)
    
    if type(item['brand']) is not str or len(item['brand'])>255:
        validator['brand'].append(i)
        
    if type(item['flavor']) is not list:
        validator['flavor'].append(i)
    else:
        for j, subItem in enumerate(item['flavor']):
            if type(subItem) is not str or 100 < len(subItem) == 0:
                validator['flavor'].append((i, j))

    if type(item['nic']) is not list:
        validator['nic'].append(i)
    else:
        for j, subItem in enumerate(item['nic']):
            if type(subItem) is not int or 3 < len(str(subItem)) == 0:
                validator['nic'].append((i, j))
    
    if type(item['size']) is not list:
        validator['size'].append(i)
    else:
        for j, subItem in enumerate(item['size']):
            if type(subItem) is not int or 3 < len(str(subItem)) == 0:
                validator['size'].append((i, j))

    if type(item['vgpg']) is not list:
        validator['vgpg'].append(i)
    else:
        for j, subItem in enumerate(item['vgpg']):
            if type(subItem) is not str:
                validator['vgpg'].append((i, j))
            elif not re.match(r'\d{2}/\d{2}', subItem):
                validator['vgpg'].append((i, j))


validCheck = True
for key, value in validator.items():
    if len(value) > 0:
        validCheck = False
if validCheck:
    print("All valid, saving the clean JSON")
    with open(f"cleanJson_{jsonOutput['meta']['websiteName']}.json", 'w') as outfile:
        json.dump(jsonOutput, outfile, indent=2,separators=(',', ': '))
else:
    print("Error saving. Fix validation errors in the validator dict")





















