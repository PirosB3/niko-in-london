angular.module('nikoInLondon.services', ['ngResource']).
    factory('Photo', function($resource) {
        return $resource('photos/:photoId', { photoId: '@_id'});
    }).
    factory('Comment', function($resource) {
        return $resource('photos/:photoId/comments', { photoId: 'photoId'});
    });

function MainController($scope, $window, $routeParams, Photo, Comment) {
    $scope.photos = Photo.query();
    $scope.selectedPhoto = $routeParams.photo;
    if ($scope.selectedPhoto) {
        $scope.newComment = new Comment();
    }
    $window.document.title = $scope.selectedPhoto ? "Niko In London | " + $scope.selectedPhoto.title : "Niko In London | All Photos";

    $scope.submitNewComment = function() {
        $scope.newComment.$save({ photoId : $scope.selectedPhoto._id }, function() {
            $scope.selectedPhoto.comments.push($scope.newComment);
            $scope.newComment = new Comment();
        });
    }
};
