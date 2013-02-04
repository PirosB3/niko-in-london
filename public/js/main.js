angular.module('nikoInLondon.services', ['ngResource']).
    factory('DOMUtils', function($resource) {
        return {
            flushModalBackdropFlusher : function(el) {
                return el.find('.modal-backdrop').remove();
            }
        };
    }).
    factory('Photo', function($resource, $q) {
        var Photo = $resource('photos/:photoId', { photoId: '@_id'});
        var cache;
        return {
            getPhotos: function() {
                var def = $q.defer();
                if (cache) {
                    def.resolve(cache);
                } else {
                    Photo.query(function(res) {
                        cache = res;
                        def.resolve(cache);
                    });
                }
                return def.promise;
            }
        }
    }).
    factory('Comment', function($resource) {
        return $resource('photos/:photoId/comments', { photoId: 'photoId'});
    });

angular.module('nikoInLondon.directives', ['nikoInLondon.services', 'nikoInLondon.controllers']).
    directive('photoGrid', function() {
        var linkFn = function(scope, element, attrs) {
            element.masonry({
                itemSelector: attrs.itemSelector,
                columnWidth: 240,
                animationOptions: {
                  duration: 400
                }
            });
        }
        return {
            restrict: 'E',
            link: linkFn,
            scope : {
                itemSelector: '=',
                photos: '='
            }
        }
    }).
    directive('photoUploader', function() {
        return {
            restrict: 'E',
            templateUrl: 'public/views/photo-new.html',
            controller: 'PhotoUploaderController',
            scope: true
        }
    }).
    directive('photo', function() {
        return {
            templateUrl: 'public/views/photo-single.html',
            transclude: true,
            restrict: 'E',
            scope : {
                model: '='
            }
        }
    }).
    directive('photoModal', function(Comment, $location, DOMUtils) {
        return {
            restrict: 'E',
            templateUrl: 'public/views/photo-modal.html',
            scope: {
                photo : '='
            },
            link: function(scope, el, attrs) {
                DOMUtils.flushModalBackdropFlusher($(document.body));

                scope.newComment = new Comment;
                scope.submitComment = function() {
                    scope.newComment.$save({ photoId: scope.photo._id }, function(res) {
                        scope.photo.comments.push(res);
                        scope.newComment = new Comment;
                    });
                };

                el.on('hidden', function() {
                    scope.$apply(function() {
                        $location.path('/');
                    });
                });
                scope.$watch('photo', function(photo) {
                    if (!photo) {
                        el.hide();
                        el.modal('hide');
                    } else {
                        el.show();
                        el.modal('show');
                    }
                });
            }
        }
    });

angular.module('nikoInLondon.controllers', ['nikoInLondon.services']).
    controller('MainController', function($scope, $window, $routeParams, Photo, Comment, $location) {
        Photo.getPhotos().then(function(res) {
            $scope.photos = res;
            if ($routeParams.photoId) {
                $scope.photos.forEach(function(el) {
                    if (el._id === $routeParams.photoId) $scope.selectedPhoto = el;
                });
                if (!$scope.selectedPhoto) {
                    $location.path('/');    
                } else {
                    $window.document.title = "Niko In London | " + $scope.selectedPhoto.title;
                }
            }
        });
        $window.document.title = "Niko In London | All Photos";
    }).
    controller('PhotoUploaderController', function($scope, $q) {
        $scope.status = 'idle';

        this.checkValid = function(e) {
            return e.dataTransfer && e.dataTransfer.files.length > 0;
        };

        this.readData = function(file) {
            var def = $q.defer();
            var reader = new FileReader();
            reader.onload = function (event) {
                def.resolve({
                    name: file.name,
                    type: file.type,
                    data: event.target.result
                });
            };
            reader.readAsDataURL(file);
            return def.promise;
        };

        this.onDropHandler = function(e) {
            if (!this.checkValid(e)) return;
            $scope.status = 'loading';
            $q.when(this.readData(e.dataTransfer.files[0])).then(function(res) {
                $scope.photo = angular.extend({
                    title: res.file.substring(0, res.file.lastIndexOf('.'))
                }, res);
                $scope.status = 'loaded';
            });
        }
    });

angular.module('nikoInLondon', ['nikoInLondon.controllers', 'nikoInLondon.directives', 'nikoInLondon.services']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', { templateUrl: 'public/views/main.html', controller: 'MainController'});
    $routeProvider.when('/photos/:photoId', {templateUrl: 'public/views/main.html', controller: 'MainController' });
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
