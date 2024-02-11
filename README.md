## Market Scanner

### About 🛈
An SPA that compiles vape products from several websites into one table that can be navigated, searched, and filtered. The main motivation was to get all available products from several websites in one clean table, as some vape websites are usually messy and have clunky filter/search functionalities.

Users can click on a product and it will redirect them to the item’s page on its corresponding website. 

Only two websites have been scraped, but can be expanded upon using Scrapy (See below)

### Built with 🔧
- Flask
- Bootstrap
- SQLAlchemy
- Scrapy
- Bootstrap

### Features 📋
-	Responsive display
-	Pagination
  o	Data of adjacent pages are fetched/deleted in the background asynchronically based on the current page, providing smooth and fast transition between pages
-	Data filtering
  o	Filter based on website, name, product attributes, and other categories
  o	Combine filters (concurrently or consecutively)
  o	Filter options are based on the data fetched (i.e. filtered data will have a filter that contains exclusively their attributes for further filtering)


### ⛔ Declaimer ⛔
Crawling of the items from the original source website may not always yield perfect results due to the poor HTML structure of some sites. As a result, some data on this website may appear as "No Data" in the table. Some items may be out of stock.
Please note that we do not own or claim any rights to the data displayed here; all data belong to their respective websites.

🚭 This website does not endorse or promote smoking or vaping in any way. We encourage our visitors to make informed and responsible choices regarding their health and well-being.

### Usage 🧮
1-	If you want to use Visual Studio, just run the .sln file, build the environment, and run the server.\
2-	Alternatively, you can just create your own virtualenv in the command line and run flask.

### Scrapy 🕷
You can use [this](https://thepythonscrapyplaybook.com/scrapy-beginners-guide/) demo to get the hang of Scrapy.
To use the scrapping files in this project:

1-	Go to one of the folders that end with “_scraper “ (e.g. vapegateae_scraper)\
2-	Modify the spider to match the website you are targeting.\
3-	Maintain the format that is returned by the parseItem function (in the spider.py)\
4-	Run the spider
```sh
scrapy crawl spider -O websitedata.json
```
5-	Run the postScraperJsonCleaner on the outputted json. This will\
  a.	Clean the data (this will vary between websites as they each have their own mess and inconsistencies)\
  b.	Place the cleaned data into a json compatible with the function that will populate the DB\
6-	Uncomment code corresponding in the populateDB function in app.py\
7-	Run the function by running the flask app and calling on localhost/filldb\
8-	Data now should be in the DB, refreshing the homepage will show the new data (along with the old ones)



### Demo ⏵
![demo](https://github.com/moustafa2121/MarketScanner/blob/master/demo.gif)
