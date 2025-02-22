var viewer = new Cesium.Viewer("cesiumContainer", {
  selectionIndicator: false,
  infoBox: false,
  terrainProvider: Cesium.createWorldTerrain(),
});

if (!viewer.scene.pickPositionSupported) {
  window.alert("This browser does not support pickPosition.");
}

viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
  Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
);
function createPoint(worldPosition) {
  var point = viewer.entities.add({
    position: worldPosition,
    point: {
      color: Cesium.Color.WHITE,
      pixelSize: 5,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
  return point;
}
var drawingMode = "line";
function drawShape(positionData) {
  var shape;
  if (drawingMode === "line") {
    shape = viewer.entities.add({
      polyline: {
        positions: positionData,
        clampToGround: true,
        width: 3,
      },
    });
  } else if (drawingMode === "polygon") {
    shape = viewer.entities.add({
      polygon: {
        hierarchy: positionData,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.WHITE.withAlpha(0.7)
        ),
      },
    });
  }
  return shape;
}
var activeShapePoints = [];
var activeShape;
var floatingPoint;
var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(function (event) {
  // We use `viewer.scene.pickPosition` here instead of `viewer.camera.pickEllipsoid` so that
  // we get the correct point when mousing over terrain.
  var earthPosition = viewer.scene.pickPosition(event.position);
  // `earthPosition` will be undefined if our mouse is not over the globe.
  if (Cesium.defined(earthPosition)) {
    if (activeShapePoints.length === 0) {
      floatingPoint = createPoint(earthPosition);
      activeShapePoints.push(earthPosition);
      var dynamicPositions = new Cesium.CallbackProperty(function () {
        if (drawingMode === "polygon") {
          return new Cesium.PolygonHierarchy(activeShapePoints);
        }
        return activeShapePoints;
      }, false);
      activeShape = drawShape(dynamicPositions);
    }
    activeShapePoints.push(earthPosition);
    createPoint(earthPosition);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

handler.setInputAction(function (event) {
  if (Cesium.defined(floatingPoint)) {
    var newPosition = viewer.scene.pickPosition(event.endPosition);
    if (Cesium.defined(newPosition)) {
      floatingPoint.position.setValue(newPosition);
      activeShapePoints.pop();
      activeShapePoints.push(newPosition);
    }
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
// Redraw the shape so it's not dynamic and remove the dynamic shape.
function terminateShape() {
  activeShapePoints.pop();
  drawShape(activeShapePoints);
  viewer.entities.remove(floatingPoint);
  viewer.entities.remove(activeShape);
  floatingPoint = undefined;
  activeShape = undefined;
  activeShapePoints = [];
}
handler.setInputAction(function (event) {
  terminateShape();
}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

var options = [
  {
    text: "Draw Lines",
    onselect: function () {
      if (!Cesium.Entity.supportsPolylinesOnTerrain(viewer.scene)) {
        window.alert(
          "This browser does not support polylines on terrain."
        );
      }

      terminateShape();
      drawingMode = "line";
    },
  },
  {
    text: "Draw Polygons",
    onselect: function () {
      terminateShape();
      drawingMode = "polygon";
    },
  },
];

Sandcastle.addToolbarMenu(options);
// Zoom in to an area with mountains
viewer.camera.lookAt(
  Cesium.Cartesian3.fromDegrees(-122.2058, 46.1955, 1000.0),
  new Cesium.Cartesian3(5000.0, 5000.0, 5000.0)
);
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
