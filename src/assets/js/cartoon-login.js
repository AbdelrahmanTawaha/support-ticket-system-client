// login-bear.js
// يعتمد على TweenMax (GSAP 2). تأكد أنه محمّل قبل هذا الملف.

window.initLoginBear = function initLoginBear() {

  const email = document.querySelector('#login__email');
  const password = document.querySelector('#login__password');
  const mySVG = document.querySelector('.mySVG');

  const armL = document.querySelector('.armL');
  const armR = document.querySelector('.armR');

  const eyeL = document.querySelector('.eyeL');
  const eyeR = document.querySelector('.eyeR');

  const nose = document.querySelector('.nose');
  const mouth = document.querySelector('.mouth');
  const mouthBG = document.querySelector('.mouthBG');
  const mouthOutline = document.querySelector('.mouthOutline');
  const tooth = document.querySelector('.tooth');
  const tongue = document.querySelector('.tongue');

  const chin = document.querySelector('.chin');
  const face = document.querySelector('.face');
  const eyebrow = document.querySelector('.eyebrow');

  const outerEarL = document.querySelector('.earL .outerEar');
  const outerEarR = document.querySelector('.earR .outerEar');
  const earHairL = document.querySelector('.earL .earHair');
  const earHairR = document.querySelector('.earR .earHair');

  const hair = document.querySelector('.hair');

  // Guard  // ----- Head group for shaking -----
  var headParts = [
    face, eyebrow, hair,
    eyeL, eyeR,
    nose, mouth, chin,
    outerEarL, outerEarR,
    earHairL, earHairR
  ].filter(Boolean);

  function shakeHead() {
    if (!headParts.length) return;

    // نوقف أي حركة سابقة
    TweenMax.killTweensOf(headParts);

    // هزّة خفيفة لطيفة
    TweenMax.fromTo(
      headParts,
      0.08,
      { rotation: -6, transformOrigin: "center center" },
      {
        rotation: 6,
        repeat: 5,
        yoyo: true,
        ease: Power1.easeInOut,
        onComplete: function () {
          TweenMax.to(headParts, 0.12, { rotation: 0, ease: Power1.easeOut });
        }
      }
    );
  }

  // نخليها متاحة عالميًا
  window.shakeLoginBear = shakeHead;

  if (!email || !password || !mySVG || !armL || !armR) {
    console.warn('Bear init error: missing elements');
    return function noopCleanup() {};
  }

  // حدود الحركة (زوّدتها شوي لتصير واضحة)
  const eyeMaxHorizD = 26;
  const eyeMaxVertD  = 14;
  const noseMaxHorizD = 24;
  const noseMaxVertD  = 12;

  let mouthStatus = "small";

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y1 - y2, x1 - x2);
  }

  // تحويل نقطة من viewBox (0..200) إلى صفحة حقيقية
  function svgPoint(vx, vy) {
    const rect = mySVG.getBoundingClientRect();
    const scaleX = rect.width / 200;
    const scaleY = rect.height / 200;

    return {
      x: (rect.left + vx * scaleX) + window.scrollX,
      y: (rect.top  + vy * scaleY) + window.scrollY
    };
  }

  // قياس مكان المؤشر داخل input بطريقة صحيحة
  function getCaretPoint(input) {
    const rect = input.getBoundingClientRect();
    const style = getComputedStyle(input);

    const value = input.value || '';
    const pos = (typeof input.selectionEnd === 'number')
      ? input.selectionEnd
      : value.length;

    const before = value.slice(0, pos);

    // عنصر قياس مخفي
    const measDiv = document.createElement('div');
    const measSpan = document.createElement('span');

    measDiv.style.position = 'absolute';
    measDiv.style.visibility = 'hidden';
    measDiv.style.whiteSpace = 'pre';
    measDiv.style.left = '-9999px';
    measDiv.style.top = '-9999px';

    // أهم خصائص الخط
    measDiv.style.fontFamily = style.fontFamily;
    measDiv.style.fontSize = style.fontSize;
    measDiv.style.fontWeight = style.fontWeight;
    measDiv.style.fontStyle = style.fontStyle;
    measDiv.style.letterSpacing = style.letterSpacing;

    measSpan.style.whiteSpace = 'pre';
    measSpan.textContent = before || '.';

    measDiv.appendChild(measSpan);
    document.body.appendChild(measDiv);

    const textWidth = measSpan.getBoundingClientRect().width;

    document.body.removeChild(measDiv);

    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop  = parseFloat(style.paddingTop) || 0;

    // تقدير Y وسط الحقل (أدق وأثبت)
    const x = rect.left + paddingLeft + textWidth + window.scrollX;
    const y = rect.top + paddingTop + (rect.height * 0.5) + window.scrollY;

    return { x, y };
  }

  // حركة فم بدون MorphSVG
  function setMouth(mode) {
    mouthStatus = mode;

    if (!mouthBG || !mouthOutline) return;

    if (mode === "small") {
      TweenMax.to([mouthBG, mouthOutline], 0.22, {
        scaleX: 1,
        scaleY: 1,
        transformOrigin: "center center",
        opacity: 1
      });
      tooth && TweenMax.to(tooth, 0.22, { x: 0, y: 0, opacity: 1 });
      tongue && TweenMax.to(tongue, 0.22, { x: 0, y: 0, opacity: 1 });
    }

    if (mode === "medium") {
      TweenMax.to([mouthBG, mouthOutline], 0.22, {
        scaleX: 1.18,
        scaleY: 1.12,
        transformOrigin: "center center",
        opacity: 1
      });
      tooth && TweenMax.to(tooth, 0.22, { x: 0, y: 0, opacity: 1 });
      tongue && TweenMax.to(tongue, 0.22, { x: 0, y: 1, opacity: 1 });
    }

    if (mode === "large") {
      TweenMax.to([mouthBG, mouthOutline], 0.22, {
        scaleX: 1.32,
        scaleY: 1.28,
        transformOrigin: "center center",
        opacity: 1
      });
      tooth && TweenMax.to(tooth, 0.22, { x: 3, y: -2, opacity: 1 });
      tongue && TweenMax.to(tongue, 0.22, { x: 0, y: 2, opacity: 1 });
    }
  }

  function animateFaceToward(point) {
    // نقاط مراكز ملامح الوجه داخل الـ viewBox
    const eyeLC = svgPoint(85.5, 78.5);
    const eyeRC = svgPoint(114.5, 78.5);
    const noseC = svgPoint(100, 84);
    const mouthC = svgPoint(100, 100);

    const eyeLAngle = getAngle(eyeLC.x, eyeLC.y, point.x, point.y);
    const eyeLX = Math.cos(eyeLAngle) * eyeMaxHorizD;
    const eyeLY = Math.sin(eyeLAngle) * eyeMaxVertD;

    const eyeRAngle = getAngle(eyeRC.x, eyeRC.y, point.x, point.y);
    const eyeRX = Math.cos(eyeRAngle) * eyeMaxHorizD;
    const eyeRY = Math.sin(eyeRAngle) * eyeMaxVertD;

    const noseAngle = getAngle(noseC.x, noseC.y, point.x, point.y);
    const noseX = Math.cos(noseAngle) * noseMaxHorizD;
    const noseY = Math.sin(noseAngle) * noseMaxVertD;

    const mouthAngle = getAngle(mouthC.x, mouthC.y, point.x, point.y);
    const mouthX = Math.cos(mouthAngle) * noseMaxHorizD;
    const mouthY = Math.sin(mouthAngle) * noseMaxVertD;
    const mouthR = Math.cos(mouthAngle) * 7;

    const chinX = mouthX * 0.85;
    const chinY = mouthY * 0.55;

    const faceX = mouthX * 0.35;
    const faceY = mouthY * 0.45;
    const faceSkew = Math.cos(mouthAngle) * 6;
    const eyebrowSkew = Math.cos(mouthAngle) * 22;

    const outerEarX = Math.cos(mouthAngle) * 4;
    const outerEarY = Math.cos(mouthAngle) * 5;

    const hairX = Math.cos(mouthAngle) * 6;
    const hairS = 1.12;

    eyeL && TweenMax.to(eyeL, 0.45, { x: -eyeLX, y: -eyeLY, ease: Expo.easeOut });
    eyeR && TweenMax.to(eyeR, 0.45, { x: -eyeRX, y: -eyeRY, ease: Expo.easeOut });

    nose && TweenMax.to(nose, 0.45, {
      x: -noseX, y: -noseY, rotation: mouthR,
      transformOrigin: "center center", ease: Expo.easeOut
    });

    mouth && TweenMax.to(mouth, 0.45, {
      x: -mouthX, y: -mouthY, rotation: mouthR,
      transformOrigin: "center center", ease: Expo.easeOut
    });

    chin && TweenMax.to(chin, 0.45, {
      x: -chinX, y: -chinY,
      scaleY: 1,
      ease: Expo.easeOut
    });

    if (face || eyebrow) {
      TweenMax.to([face, eyebrow], 0.45, {
        x: -faceX, y: -faceY, skewX: -faceSkew,
        transformOrigin: "center top", ease: Expo.easeOut
      });
      eyebrow && TweenMax.to(eyebrow, 0.45, {
        skewX: -eyebrowSkew,
        transformOrigin: "center top", ease: Expo.easeOut
      });
    }

    outerEarL && TweenMax.to(outerEarL, 0.45, { x: outerEarX, y: -outerEarY, ease: Expo.easeOut });
    outerEarR && TweenMax.to(outerEarR, 0.45, { x: outerEarX, y:  outerEarY, ease: Expo.easeOut });
    earHairL && TweenMax.to(earHairL, 0.45, { x: -outerEarX, y: -outerEarY, ease: Expo.easeOut });
    earHairR && TweenMax.to(earHairR, 0.45, { x: -outerEarX, y:  outerEarY, ease: Expo.easeOut });

    hair && TweenMax.to(hair, 0.45, {
      x: hairX, scaleY: hairS,
      transformOrigin: "center bottom", ease: Expo.easeOut
    });
  }

  function onEmailInput() {
    const point = getCaretPoint(email);
    animateFaceToward(point);

    const value = email.value || "";

    if (!value.length) {
      setMouth("small");
      eyeL && TweenMax.to([eyeL, eyeR], 0.2, { scaleX: 1, scaleY: 1 });
      return;
    }

    if (value.includes("@")) {
      setMouth("large");
      eyeL && TweenMax.to([eyeL, eyeR], 0.2, { scaleX: 0.75, scaleY: 0.75 });
    } else {
      setMouth("medium");
      eyeL && TweenMax.to([eyeL, eyeR], 0.2, { scaleX: 0.88, scaleY: 0.88 });
    }
  }

  function onEmailFocus() {
    onEmailInput();
  }

  function onEmailBlur() {
    resetFace();
  }

  function onEmailClickOrKey() {
    // يلتقط تحريك المؤشر داخل النص
    onEmailInput();
  }

  function onPasswordFocus() {
    coverEyes();
  }

  function onPasswordBlur() {
    uncoverEyes();
  }

  function coverEyes() {
    TweenMax.to(armL, 0.45, { x: -93, y: 2, rotation: 0, ease: Quad.easeOut });
    TweenMax.to(armR, 0.45, { x: -93, y: 2, rotation: 0, ease: Quad.easeOut, delay: 0.08 });
  }

  function uncoverEyes() {
    TweenMax.to(armL, 0.9, { y: 220, ease: Quad.easeOut });
    TweenMax.to(armL, 0.9, { rotation: 105, ease: Quad.easeOut, delay: 0.08 });

    TweenMax.to(armR, 0.9, { y: 220, ease: Quad.easeOut });
    TweenMax.to(armR, 0.9, { rotation: -105, ease: Quad.easeOut, delay: 0.08 });
  }

  function resetFace() {
    eyeL && TweenMax.to([eyeL, eyeR], 0.5, { x: 0, y: 0, scaleX: 1, scaleY: 1, ease: Expo.easeOut });
    nose && TweenMax.to(nose, 0.5, { x: 0, y: 0, rotation: 0, ease: Expo.easeOut });
    mouth && TweenMax.to(mouth, 0.5, { x: 0, y: 0, rotation: 0, ease: Expo.easeOut });
    chin && TweenMax.to(chin, 0.5, { x: 0, y: 0, scaleY: 1, ease: Expo.easeOut });

    if (face || eyebrow) {
      TweenMax.to([face, eyebrow], 0.5, { x: 0, y: 0, skewX: 0, ease: Expo.easeOut });
    }

    TweenMax.to([outerEarL, outerEarR, earHairL, earHairR, hair], 0.5, {
      x: 0, y: 0, scaleY: 1, ease: Expo.easeOut
    });

    setMouth("small");
  }

  // Bind events
  email.addEventListener('focus', onEmailFocus);
  email.addEventListener('blur', onEmailBlur);
  email.addEventListener('input', onEmailInput);
  email.addEventListener('click', onEmailClickOrKey);
  email.addEventListener('keyup', onEmailClickOrKey);

  password.addEventListener('focus', onPasswordFocus);
  password.addEventListener('blur', onPasswordBlur);

  // Initial arms pose
  TweenMax.set(armL, { x: -93, y: 220, rotation: 105, transformOrigin: "top left" });
  TweenMax.set(armR, { x: -93, y: 220, rotation: -105, transformOrigin: "top right" });

  resetFace();
  uncoverEyes();

  // Cleanup function
  return function cleanup() {
    try {
      email.removeEventListener('focus', onEmailFocus);
      email.removeEventListener('blur', onEmailBlur);
      email.removeEventListener('input', onEmailInput);
      email.removeEventListener('click', onEmailClickOrKey);
      email.removeEventListener('keyup', onEmailClickOrKey);

      password.removeEventListener('focus', onPasswordFocus);
      password.removeEventListener('blur', onPasswordBlur);
      try { delete window.shakeLoginBear; } catch {}

      TweenMax.killTweensOf([
        eyeL, eyeR, nose, mouth, chin, face, eyebrow,
        outerEarL, outerEarR, earHairL, earHairR, hair,
        armL, armR, mouthBG, mouthOutline, tooth, tongue
      ]);
    } catch {}
  };
};
