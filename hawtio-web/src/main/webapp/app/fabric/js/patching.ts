module Fabric {
  export function PatchingController($scope, jolokia, localStorage, $location) {

    $scope.files = [];
    $scope.targetVersion = null;
    $scope.newVersionName = '';
    $scope.proxyUser = localStorage['fabric.userName'];
    $scope.proxyPassword = localStorage['fabric.password'];
    $scope.saveJmxCredentials = false;

    $scope.valid = () => {
      return $scope.files.length > 0 && $scope.targetVersion !== null && $scope.proxyUser && $scope.proxyPassword;
    }

    $scope.go = () => {
      var message = $scope.files.length + ' patches';

      if ($scope.files.length === 1) {
        message = "patch: " + $scope.files[0].fileName;
      }

      notification('info', "Applying " + message);

      if ($scope.saveJmxCredentials) {
        localStorage['fabric.userName'] = $scope.proxyUser;
        localStorage['fabric.password'] = $scope.proxyPassword;
      }

      var files = $scope.files.map((file) => { return file.absolutePath; });

      applyPatches(jolokia, files, $scope.targetVersion.id, $scope.newVersionName, $scope.proxyUser, $scope.proxyPassword,
          () => {
        notification('success', "Successfully applied " + message);
        $location.url("/fabric/view");
        Core.$apply($scope);
      }, (response) => {
        notification('error', "Failed to apply " + message + " due to " + response.error);
        Core.$apply($scope);
      });


    }

  }
}
