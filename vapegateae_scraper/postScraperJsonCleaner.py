import json, re, time, csv
from operator import itemgetter

"""
This scripts takes place after scraping the items from the website
Its purpose is to take JSON from the scrape and creates a JSON that meets the standards
expected by the backend so it can be saved in the DB. the expected format is the following:

expected json format
{"meta":{"websiteName":websiteName as given by the website value is string max 100 chars,
       "websiteBase":the base url of the website value is string max 100 chars,
       "websiteIcon":full url link to the icon of the website value is string max 400 chars,
       "numberOfItems":number of items scraped value is an integer,
       "timestamp":epoch of the time in which the website was scraped in seconds}
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
"""

def openJsonDB(fileName, start=0, end=99999):
    #open the file
    file = open(fileName)
    fileData = json.load(file)
    file.close()

    itemsList = []
    for data in fileData[start:end]:
        itemsList.append(data)

    return itemsList

#read the original json
itemList = openJsonDB('data.json')

#the clean json to be saved
jsonOutput = {"meta":{"websiteName":"Vape Gate AE",
       "websiteBase":"https://vapegateae.com/",
       "websiteIcon":"https://vapegateae.com/cdn/shop/files/logo-vape-gate-last-edit-for-website_180x.png?v=1664516275%20180w,%20",
        "numberOfItems":len(itemList),
       "timestamp":"1703633818"},
        "itemList":[]}

for item in itemList:
    if len(item['flavor']) > 0:
        item['flavor'] = item['flavor'][0].replace('Â\xa0', ' ')
        item['flavor'] = item['flavor'].lower().split('flavor')[0]
        item['flavor'] = item['flavor'].lower().split('flavour')[0]
        item['flavor'] = [item['flavor']]
    else:
        item['flavor'] = []

    jsonOutput['itemList'].append(item)
    
#output to examine the data
"""
with open('simple.csv', 'w', newline='') as csvfile:
    spamwriter = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    spamwriter.writerow(('itemLink', 'productImageLink', 'name', 'brand', 'flavor', 'vgpg', 'nic', 'size'))
    for item in itemList:
        spamwriter.writerow(itemgetter('itemLink', 'productImageLink', 'name', 'brand', 'flavor', 'vgpg', 'nic', 'size')(item))
"""


with open(f"cleanJson_{jsonOutput['meta']['websiteName']}.json", 'w') as outfile:
    json.dump(jsonOutput, outfile, indent=2,separators=(',', ': '))



"""
"name":name as given value is string max 255 chars,
"itemLink":the full url of the item value is string max 400 chars,
"productImageLink":the full url of one image of the item value is string max 400 chars,
"brand":the brand of the item value is string max 255 chars,
"flavor": a list of flavors variants of the item value is string each max 100 chars,
"nic": a list of nicotine variants of the item each value is an int 1 to 3 digits,
"size": a list of size variants of the item each value is an int 1 to 3 digits,
"vgpg": a list of vgpg variants of the item each value is a string of the format dd/dd,
"""














