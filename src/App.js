import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);

  const addMoveable = async () => {
    // Create a new moveable component and add it to the array
    const COLORS = ["red", "blue", "yellow", "green", "purple"];
    const FITS = ["fill", "cover", "contain"];
    const randomNum = Math.floor(Math.random() * 99);

    const img = await fetch(
      `https://jsonplaceholder.typicode.com/photos/${randomNum}`,
      {
        method: "GET",
      }
    ).then((response) => response.json());

    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.floor(Math.random() * Date.now()),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        bgImage: img.url,
        fit: FITS[Math.floor(Math.random() * FITS.length)],
        updateEnd: true,
      },
    ]);
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  // This is implemented directly in onResize method
  const handleResizeStart = (index, e, left) => {
    console.log("e", e.direction);
    // Check if the resize is coming from the left handle
    const [handlePosX, handlePosY] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1
    // -1, 0
    // -1, 1
    if (handlePosX === -1) {
      console.log("width", moveableComponents, e);
      // Save the initial left and width values of the moveable component
      const initialLeft = left;
      const initialWidth = e.width;

      console.log(initialLeft);
      // Set up the onResize event handler to update the left value based on the change in width
    }
  };

  const removeMoveable = () => {
    console.log(selected);
    console.log(moveableComponents);

    let newMoveables = moveableComponents.filter((moveable) => {
      return moveable.id != selected;
    });

    setMoveableComponents(newMoveables);
  };

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable}>Add Moveable</button>
      <button onClick={removeMoveable}>Remove Selected Moveable</button>
      <div
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  handleResizeStart,
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  fit,
  bgImage,
  id,
  setSelected,
  isSelected = false,
  updateEnd,
}) => {
  const ref = useRef();
  let inBorder = false;

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    id,
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();

  const onResize = async (e) => {
    // ACTUALIZAR ALTO Y ANCHO
    const [handlePosX, handlePosY] = e.direction;
    let newWidth = e.width;
    let newHeight = e.height;
    let newLeft = left;
    let newTop = top;

    // Left
    if (handlePosX === -1) {
      // const actualWidth
      const actualWidth = width;
      const initialWidth = e.width;

      // Substract the actual for new
      const diference = initialWidth - actualWidth;
      newLeft = left - diference;

      if (left <= 0) {
        left = 0;
        newWidth = width;
      }
    }

    // Top
    if (handlePosY === -1) {
      const actualHeight = height;
      const eventHeight = e.height;

      // Substract the actual for new
      const diference = eventHeight - actualHeight;
      newTop = top - diference;

      if (top <= 0) {
        top = 0;
        newHeight = height;
      }
    }

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(id, {
      top: newTop,
      left: newLeft,
      width: newWidth,
      height: newHeight,
      bgImage,
      fit,
      color,
    });

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${newWidth}px`;
    ref.current.style.height = `${newHeight}px`;

    // if (inBorder) {
    //   let translateX = beforeTranslate[0];
    // }
    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    let absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    if (top <= 0) {
      absoluteTop = 0;
      newHeight = height;
    }

    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        color,
        bgImage,
        fit,
      },
      true
    );
  };

  const onDrag = (e) => {
    let newTop = e.top;
    let newLeft = e.left;

    // Check if one side of the rectangle is out of border
    // by checking it's relative position in comparision to the parent
    if (e.top < 0) {
      newTop = 0;
    } else if (e.top + height > parentBounds?.height) {
      newTop = parentBounds?.height - height;
    }

    if (e.left < 0) {
      newLeft = 0;
    } else if (e.left + width > parentBounds?.width) {
      newLeft = parentBounds?.width - width;
    }

    // Call the function to update whit the restricted values if needed
    updateMoveable(id, {
      top: newTop,
      left: newLeft,
      width,
      height,
      color,
      bgImage,
      fit,
    });
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
          // background: color,
          backgroundImage: `url(${bgImage})`,
          objectFit: `${fit}`,
        }}
        onClick={() => setSelected(id)}
      />

      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={onDrag}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      />
    </>
  );
};
