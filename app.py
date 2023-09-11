import dbInterface, models
from flask import Flask, render_template
from flask import request, make_response

app = Flask(__name__)
wsgi_app = app.wsgi_app


@app.route('/', methods=['GET'])
def homePage():
    #get the data
    data = dbInterface.openJsonDB("static/vape-shop-dubai.json")
    #used to fill empty cells
    constantsValues = {'noDataVariable' : 'No Data'}

    print(request.cookies.get(''))
    #models.runTest()

    return render_template("index.html", lst=data[:15], constantsValues=constantsValues)



#move to the a server running script
#also change the server
if __name__ == '__main__':
    import os
    HOST = os.environ.get('SERVER_HOST', 'localhost')
    try:
        PORT = int(os.environ.get('SERVER_PORT', '5555'))
    except ValueError:
        PORT = 5555
    app.run(HOST, PORT, True)
