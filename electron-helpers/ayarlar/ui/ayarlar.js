var app = angular.module("myApp", []);
var ipcRenderer = require("electron").ipcRenderer;
app.controller("myCtrl", function ($scope) {
  $scope.kantarConfig = {};
  $scope.loading = true;
  $scope.dsCOMPort = Array.from({ length: 100 }, (_, i) => i + 1).map(a => "COM" + a);

  ipcRenderer.on("config", (event, data) => {
    $scope.loading = false;
    console.log(data);
    $scope.kantarConfig = data;
    $scope.$apply();
  });

  $scope.save = function () {
    ipcRenderer.send("kantarConfig", $scope.kantarConfig);
    window.close();
  };
});
