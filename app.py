

import dbInterface
from flask import Flask, render_template

app = Flask(__name__)
wsgi_app = app.wsgi_app


@app.route('/')
def homePage():
    #get the data
    data = dbInterface.openJsonDB("static/vape-shop-dubai.json")

    return render_template("index.html", lst=data[:35])



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
