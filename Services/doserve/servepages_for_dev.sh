 uwsgi --http 0.0.0.0:8000 --master -p 4 -w servepages:app --static-map "/css=./assets/css"

