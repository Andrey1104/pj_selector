import {motion} from 'framer-motion';

export function AspLogo({
                          size = 100,
                          animated = false,
                          showText = true,
                          color = '#da992d'
                        }) {
  return (
    <div
      className="inline-flex flex-col items-center justify-center gap-4"
      style={{width: size}}
    >
      <div className="relative" style={{width: size, height: size}}>
        <motion.svg
          animate={animated ? {rotate: 360} : {}}
          transition={animated ? {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          } : {}}
          className="absolute inset-0"
          viewBox="0 0 100 100"
          style={{
            width: size,
            height: size,
            transformOrigin: '50% 50%',
            transformBox: 'fill-box',
          }}
        >
          <polygon
            points="50,10 85,30 85,70 50,90 15,70 15,30"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.3"
          />
        </motion.svg>

        <motion.svg
          animate={animated ? {rotate: -360} : {}}
          transition={animated ? {
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          } : {}}
          className="absolute inset-0"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            margin: 'auto',
            position: 'absolute',
            top: 0.55,
            left: 0.65,
            right: 0,
            bottom: 0,
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.5"
            strokeDasharray="70 30"
          />
        </motion.svg>

        <motion.div
          animate={animated ? {
            boxShadow: [
              `0 0 20px ${color}40`,
              `0 0 40px ${color}60`,
              `0 0 20px ${color}40`,
            ],
          } : {}}
          transition={animated ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          } : {}}
          className="absolute"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: '50%',
            backgroundColor: `${color}10`,
            border: `2px solid ${color}`,
            top: '50.5%',
            left: '50.6%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: size * 0.2,
              fontWeight: 'bold',
              color: color,
              opacity: 0.6
            }}
          >
            ASP
          </span>
        </motion.div>

        {animated && (
          <motion.div
            animate={{rotate: 360}}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0"
            style={{
              width: size,
              height: size,
            }}
          >
            <div
              style={{
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: '50%',
                backgroundColor: color,
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                boxShadow: `
                  0 0 10px ${color},
                  0 0 20px ${color},
                  0 0 40px ${color},
                  0 0 80px ${color}
                `
              }}
            />
          </motion.div>
        )}

        {animated && (
          <motion.div
            animate={{rotate: -360}}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0"
            style={{
              width: size,
              height: size,
            }}
          >
            <div
              style={{
                width: size * 0.06,
                height: size * 0.06,
                borderRadius: '50%',
                backgroundColor: color,
                position: 'absolute',
                bottom: size * 0.15,
                right: 0,
                boxShadow: `
                  0 0 10px ${color},
                  0 0 20px ${color},
                  0 0 40px ${color},
                  0 0 80px ${color}
                `
              }}
            />
          </motion.div>
        )}
      </div>

      {showText && (
        <div
          style={{
            fontSize: size * 0.16,
            fontWeight: 600,
            color: color,
            letterSpacing: size * 0.08,
          }}
        >
          LAB
        </div>
      )}
    </div>
  );
}

export function AspLogoAnimated(props) {
  return <AspLogo {...props} animated={true}/>;
}