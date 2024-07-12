# RotaKantar

- Development 
    Angular 4200 portunda hostlanır ve electron penceresinde localhost:4200(url) açılır.
    - environment.production -> false
    - ng serve 
    - npm run electron serve
- Production
    Angular build alınır ve electron penceresinde build dosyasındaki index.html(file) açılır.
    - environment.production -> true
    - npm run electronB (with ng build)
    - npm run electron (son build dosyasından electron açılır)

# GH Token Aktifleştirme
- $env:GH_TOKEN = 'token'
