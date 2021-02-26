import React, { useState, useRef, useEffect } from "react";
import "./style.scss";

const imageArray = [
  "https://placedog.net/150/200",
  "https://placedog.net/200/150",
];

const Canvas = () => {
  /** state updates */
  const [imgs] = useState(imageArray); //images
  const [movingItem, setMovingItem] = useState(0); //index for item are to move
  const [isDragging, setIsDragging] = useState(false); // drag state
  const [size, setSize] = useState({ canvasWidth: 0, canvasHeight: 0 }); //size of canvas

  /** refs */
  const wrapperRef = useRef(null); //div wrapper
  const trackImg = useRef(null); //img array in canvas
  const canvasRef = useRef(null); //canvas
  const contextRef = useRef({}); // context

  /**
   * resize the canvas per a 16:9 aspect ratio
   */
  const resizeCanvas = () => {
    const wrapperWidth = wrapperRef.current.clientWidth;
    setSize({
      canvasWidth: wrapperWidth,
      canvasHeight: Math.floor((wrapperWidth / 16) * 9),
    });
  };

  /**
   * load image into the component
   * @param {string} src the url to the image
   */
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => {
        resolve(image);
      });
      image.addEventListener("error", reject);
      image.src = src;
    });
  };

  /**
   * handle the initital load of images
   * @param {Array} imageUrls the list of image
   */
  async function loadImages(imageUrls) {
    const images = [];

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const element = await loadImage(imageUrls[i]);
        const maxWidth = canvasRef.current.clientWidth / 10;
        const imgWidth = parseInt(element.width);
        const imgHeight = parseInt(element.height);
        const ratio = maxWidth / imgWidth;

        images.push({
          element,
          data: {
            x: i === 0 ? 0 : 0 + imgWidth,
            y: 0,
            width: imgWidth * ratio,
            height: imgHeight * ratio,
          },
        });
      } catch (err) {
        console.error(err.message);
      }
    }
    return images;
  }

  /**
   * handle the initial draw of images onto the canvas
   */
  const drawImages = () => {
    trackImg.current.forEach((image) => {
      const imageRect = new Path2D();
      imageRect.rect(0, 0, image.data.width, image.data.height);
      image.path = imageRect;

      contextRef.current.drawImage(
        image.element,
        image.data.x,
        image.data.y,
        image.data.width,
        image.data.height
      );
    });

    setBorder(movingItem, "green");
  };

  /**
   * create an instance variable for the array image content
   */
  const initImgLoad = async () => {
    const images = await loadImages(imgs);
    trackImg.current = images;
  };

  /**
   * toggle the image to be moved
   */
  const selectImage = () => {
    setMovingItem((prevItem) => {
      setBorder(prevItem, "white");

      if (prevItem === imgs.length - 1) return 0;
      return prevItem + 1;
    });
  };

  /**
   * show the border for selected element
   * @param {Number|string} item the index of the item we want to set border tp
   * @param {string} color the color we want to update to
   * @param {Number|undefined} x x coordinates
   * @param {Number|undefined} y coordinates
   */
  const setBorder = (item, color, x, y) => {
    contextRef.current.lineWidth = 2;
    contextRef.current.strokeStyle = color;
    contextRef.current.strokeRect(
      x ?? trackImg.current[item].data.x,
      y ?? trackImg.current[item].data.y,
      trackImg.current[item].data.width,
      trackImg.current[item].data.height
    );
  };

  /**
   * Handle MouseDown, allow items that mouse selected to be move (cannot be outside of image)
   * @param {KeyboardEvent} e the keyboard selection effected
   */

  const handleMouseDown = (e) => {
    const c = canvasRef.current;
    const item = trackImg.current[movingItem];
    let mouseX = e.pageX - c.offsetLeft;
    let mouseY = e.pageY - c.offsetTop;

    //if not clicking on current selected item
    if (
      mouseX >= item.data.x &&
      mouseY >= item.data.y &&
      mouseX <= item.data.x + item.data.width &&
      mouseY <= item.data.y + item.data.height
    )
      setIsDragging(true);
  };

  /**
   * Handle MouseDown, move action of selected item, disallow if trying to move off canvas
   * @param {KeyboardEvent} e the keyboard selection effected
   */
  const handleMouseMove = (e) => {
    if (isDragging) {
      const c = canvasRef.current;
      const item = trackImg.current[movingItem];
      const mouseX = e.pageX - c.offsetLeft;
      const mouseY = e.pageY - c.offsetTop;
      const canvasRight = c.offsetLeft + c.clientWidth;
      const canvasBottom = c.offsetTop + c.clientHeight;

      //make sure we don't drag out of viewport
      if (
        mouseX > canvasRight - item.data.width ||
        mouseY > canvasBottom - item.data.height
      ) {
        return;
      }

      const adjustImg = () => {
        //clear the canvas
        contextRef.current.fillStyle = "#fff";
        contextRef.current.fillRect(
          0,
          0,
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );

        contextRef.current.clearRect(
          trackImg.current[movingItem].element,
          0,
          0,
          trackImg.current[movingItem].width,
          trackImg.current[movingItem].height
        );

        trackImg.current[movingItem].data = {
          ...trackImg.current[movingItem].data,
          x: mouseX,
          y: mouseY,
        };

        //redo content
        trackImg.current.forEach((item) => {
          contextRef.current.drawImage(
            item.element,
            item.data.x,
            item.data.y,
            item.data.width,
            item.data.height
          );
        });

        //border
        setBorder(movingItem, "green", mouseX, mouseY);
      };

      adjustImg();
    }
  };

  /**
   * Handle MouseUp, Clean up
   * @param {KeyboardEvent} e the keyboard selection effected
   */

  const handleMouseUp = (e) => {
    setIsDragging(false);
    contextRef.current.clearRect(
      trackImg.current[movingItem].element,
      0,
      0,
      trackImg.current[movingItem].data.width,
      trackImg.current[movingItem].data.height
    );
  };

  /**
   * Handle MouseUp, Disallow move from outside canvas
   * @param {KeyboardEvent} e the keyboard selection effected
   */
  const handleMouseOut = (e) => {
    setIsDragging(false);
  };

  useEffect(() => {
    // listen for resize
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    // initial load, resize canvas, set context and draw images
    resizeCanvas();
    contextRef.current = canvasRef.current?.getContext("2d");
    (async () => {
      await initImgLoad();
      drawImages();
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (trackImg.current) {
      // set border on state update from cta
      setBorder(movingItem, "green");
    }
  }, [movingItem]);

  return (
    <div ref={wrapperRef} id="canvas">
      <canvas
        ref={canvasRef}
        width={size.canvasWidth}
        height={size.canvasHeight}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={(e) => handleMouseMove(e)}
        onMouseUp={(e) => handleMouseUp(e)}
        onMouseOut={(e) => handleMouseOut(e)}
      />
      <div className="cta">
        <div className="instructions">
          Press on the button to choose which image you want selected
        </div>
        <button onClick={selectImage}>Toggle Image</button>
      </div>
    </div>
  );
};

export default Canvas;
