import React, { useEffect, useState } from "react";
import "./Home.css";

function Home() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("/api/hello")
            .then((res) => res.json())
            .then((res) => setMessage(res.message));
    }, []);

    return (
        <div className="home">
            <h1>Home</h1>
            <p>{message}</p>

            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Sit
                amet venenatis urna cursus eget nunc scelerisque viverra mauris.
                Facilisis leo vel fringilla est ullamcorper. Sem fringilla ut
                morbi tincidunt augue interdum velit euismod in. Sed id semper
                risus in hendrerit. Quam quisque id diam vel quam elementum
                pulvinar etiam. Facilisis gravida neque convallis a cras.
                Consectetur adipiscing elit pellentesque habitant morbi
                tristique senectus et. Eu augue ut lectus arcu bibendum.
                Sagittis aliquam malesuada bibendum arcu. Id aliquet risus
                feugiat in ante metus dictum at tempor. Quam adipiscing vitae
                proin sagittis nisl rhoncus mattis. Sem et tortor consequat id
                porta nibh. Enim nunc faucibus a pellentesque.
            </p>
            <br />
            <p>
                Mattis aliquam faucibus purus in massa tempor nec. Fermentum dui
                faucibus in ornare quam viverra. Pellentesque massa placerat
                duis ultricies lacus sed turpis. Suspendisse in est ante in.
                Amet est placerat in egestas. Lorem ipsum dolor sit amet
                consectetur. Risus commodo viverra maecenas accumsan lacus vel
                facilisis. Iaculis urna id volutpat lacus laoreet. Tortor id
                aliquet lectus proin nibh nisl condimentum. At tempor commodo
                ullamcorper a lacus. Sit amet luctus venenatis lectus magna.
                Odio aenean sed adipiscing diam donec adipiscing tristique risus
                nec. Dolor morbi non arcu risus quis varius quam quisque id.
                Vulputate sapien nec sagittis aliquam malesuada bibendum arcu
                vitae. Sed euismod nisi porta lorem. Sollicitudin nibh sit amet
                commodo nulla facilisi nullam vehicula ipsum. Purus gravida quis
                blandit turpis.
            </p>
            <br />
            <p>
                Tempus iaculis urna id volutpat lacus. Rhoncus est pellentesque
                elit ullamcorper dignissim cras. Pretium aenean pharetra magna
                ac placerat vestibulum lectus mauris. Nec feugiat in fermentum
                posuere urna nec tincidunt. Praesent elementum facilisis leo vel
                fringilla est. Convallis posuere morbi leo urna molestie at
                elementum eu facilisis. Enim diam vulputate ut pharetra sit amet
                aliquam. Dui nunc mattis enim ut tellus elementum sagittis vitae
                et. Nascetur ridiculus mus mauris vitae ultricies. Dolor sit
                amet consectetur adipiscing elit ut aliquam purus. Odio ut enim
                blandit volutpat maecenas volutpat blandit. Eget aliquet nibh
                praesent tristique magna sit amet purus gravida. Sagittis orci a
                scelerisque purus semper eget duis at tellus. Ullamcorper morbi
                tincidunt ornare massa eget egestas purus viverra accumsan.
                Ligula ullamcorper malesuada proin libero. Molestie a iaculis at
                erat pellentesque adipiscing. Vitae tempus quam pellentesque
                nec. Est pellentesque elit ullamcorper dignissim cras tincidunt.{" "}
            </p>
            <br />
            <p>
                Ipsum dolor sit amet consectetur adipiscing elit. Mi eget mauris
                pharetra et ultrices neque ornare. Lacus sed turpis tincidunt id
                aliquet risus feugiat in. Egestas sed sed risus pretium quam
                vulputate dignissim suspendisse. Sed elementum tempus egestas
                sed. Purus sit amet volutpat consequat mauris nunc. Tempor
                commodo ullamcorper a lacus vestibulum sed arcu non. Ipsum dolor
                sit amet consectetur adipiscing elit duis tristique. Egestas sed
                sed risus pretium. Morbi tempus iaculis urna id volutpat lacus.
                Eget nunc scelerisque viverra mauris in aliquam sem. Pulvinar
                mattis nunc sed blandit. Diam quis enim lobortis scelerisque.
                Nisi quis eleifend quam adipiscing vitae proin sagittis.
            </p>
            <br />
            <p>
                Id diam maecenas ultricies mi eget mauris pharetra et ultrices.
                Ut sem nulla pharetra diam sit. Eget gravida cum sociis natoque.
                Massa placerat duis ultricies lacus. Mauris a diam maecenas sed.
                Suspendisse sed nisi lacus sed viverra tellus in. Imperdiet dui
                accumsan sit amet nulla. Diam ut venenatis tellus in metus
                vulputate eu scelerisque felis. Pharetra massa massa ultricies
                mi quis hendrerit dolor magna eget. Senectus et netus et
                malesuada fames ac turpis. Praesent elementum facilisis leo vel
                fringilla est. Rutrum quisque non tellus orci. Dui accumsan sit
                amet nulla facilisi morbi tempus. Eget magna fermentum iaculis
                eu. Duis at tellus at urna condimentum mattis pellentesque.
            </p>
        </div>
    );
}

export default Home;
