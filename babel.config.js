module.exports = {
    presets: [
      // Your other presets
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"], // Root directory
          alias: {
            "@": "./", // Map @ to the root
          },
        },
      ],
    ],
  };  